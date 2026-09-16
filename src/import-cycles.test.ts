/**
 * No import cycle in this package may throw a TDZ `ReferenceError`.
 *
 * ESM evaluates a cycle's modules in dependency order and simply *skips* the
 * one already in progress. Whichever module a runtime enters first therefore
 * decides which bindings exist when each body runs — so a module that reads a
 * `const` from its cycle partner **while loading** works or throws depending on
 * the entry point, and nothing about it fails at build time.
 *
 * That shipped. `gm-catalogue.ts` built its 128 rows from `UNLIMITED_POLYPHONY`
 * in `gm-polyphony.ts`, which imported `gmSpec` back from the catalogue:
 *
 *     node -e "import('.../dist/domain/instruments/gm-polyphony.js')"
 *     ReferenceError: Cannot access 'UNLIMITED_POLYPHONY' before initialization
 *
 * The apps never saw it, because their bundlers happened to reach the catalogue
 * first; `music_api` consumes this package under plain Node ESM, where module
 * order can differ. `music-vocabulary.js` was unimportable the same way, via
 * `picker-options.ts` reaching `SONG_SECONDS` through the package barrel.
 *
 * Two rules, and between them they are what an entry-point probe would find
 * without spawning 145 Node processes:
 *
 *  1. **No cycle that does not pass through `src/index.ts`.** A barrel is a
 *     cycle by construction — it re-exports the modules that import it — and
 *     that one is tolerated. A cycle between two ordinary modules is not: it is
 *     always a symbol declared on the wrong side of an arrow.
 *
 *  2. **No module in any cycle may read a cycle partner's binding at
 *     module-evaluation time** — a table or `const` built as the module loads,
 *     as opposed to a name used inside a function body, which does not run
 *     until long after every module is initialised. This is the property that
 *     actually throws, and it is what makes rule 1's tolerated barrel cycle
 *     safe rather than merely present.
 *
 * Both allow-lists are empty on purpose: an exemption should be a decision
 * somebody writes down here, not a line that quietly accumulates.
 */
import { describe, expect, it } from 'vitest';
import { globSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import ts from 'typescript';

/** Cycles permitted by rule 1, as sorted module lists. None today. */
const ALLOWED_CYCLES: readonly (readonly string[])[] = [];

/** Modules permitted to read a cycle partner while loading. None today. */
const ALLOWED_EVAL_TIME_READS: readonly string[] = [];

type Imported = {
  /** The local name bound in this module. */
  local: string;
  /** The module it came from, as a repo-relative `src/...` path. */
  from: string;
};

type Module = {
  /** Repo-relative, e.g. `src/domain/instruments/gm-catalogue.ts`. */
  path: string;
  source: ts.SourceFile;
  /** Modules this one imports a VALUE from; type-only edges are erased. */
  deps: Set<string>;
  /** Value bindings this module imports, by local name. */
  bindings: Imported[];
};

/** What ships: every source module, test files and test helpers excluded. */
function sourceFiles(): string[] {
  return globSync('src/**/*.ts', { cwd: process.cwd() })
    .filter((f) => !f.includes('.test.') && !f.startsWith(join('src', 'test')))
    .map(normalize)
    .sort();
}

/**
 * Resolve a relative specifier to a module in this package, or `null`.
 *
 * The emitted JS imports `./x.js`; the source it came from is `./x.ts`.
 */
function resolveSpecifier(
  fromFile: string,
  specifier: string,
  known: ReadonlySet<string>,
): string | null {
  if (!specifier.startsWith('.')) return null;
  const abs = resolve(dirname(resolve(fromFile)), specifier);
  const asTs = relative(process.cwd(), abs).replace(/\.js$/, '.ts');
  const candidates = [asTs, join(asTs.replace(/\.ts$/, ''), 'index.ts')];
  return candidates.find((c) => known.has(normalize(c))) ?? null;
}

function parse(files: string[]): Map<string, Module> {
  const known = new Set(files);
  const modules = new Map<string, Module>();

  for (const path of files) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.ES2020,
      true,
    );
    const deps = new Set<string>();
    const bindings: Imported[] = [];

    for (const statement of source.statements) {
      // `export ... from` is a live re-export, not a read, but it is still a
      // value edge: the target module is evaluated.
      const isImport = ts.isImportDeclaration(statement);
      const isExportFrom =
        ts.isExportDeclaration(statement) && statement.moduleSpecifier;
      if (!isImport && !isExportFrom) continue;

      const specifierNode = isImport
        ? statement.moduleSpecifier
        : (statement as ts.ExportDeclaration).moduleSpecifier!;
      if (!ts.isStringLiteral(specifierNode)) continue;

      const clause = isImport
        ? statement.importClause
        : (statement as ts.ExportDeclaration).exportClause;

      // `import type { X } from` / `export type { X } from`: fully erased.
      const wholeClauseIsTypeOnly = isImport
        ? statement.importClause?.isTypeOnly === true
        : (statement as ts.ExportDeclaration).isTypeOnly;
      if (wholeClauseIsTypeOnly) continue;
      // A bare `import './x.js'` has no clause but does evaluate the module.
      if (isImport && !clause) {
        const target = resolveSpecifier(path, specifierNode.text, known);
        if (target) deps.add(target);
        continue;
      }

      const named =
        isImport && ts.isImportDeclaration(statement)
          ? statement.importClause?.namedBindings
          : (statement as ts.ExportDeclaration).exportClause;

      let hasValueSpecifier = false;
      const locals: string[] = [];

      if (isImport && statement.importClause?.name) {
        hasValueSpecifier = true; // default import
        locals.push(statement.importClause.name.text);
      }
      if (named && ts.isNamespaceImport(named)) {
        hasValueSpecifier = true;
        locals.push(named.name.text);
      }
      if (named && (ts.isNamedImports(named) || ts.isNamedExports(named))) {
        for (const element of named.elements) {
          if (element.isTypeOnly) continue; // `import { type X }`
          hasValueSpecifier = true;
          if (ts.isImportSpecifier(element)) locals.push(element.name.text);
        }
      }
      // `export * from './x.js'` re-exports values.
      if (!isImport && !named) hasValueSpecifier = true;

      if (!hasValueSpecifier) continue;
      const target = resolveSpecifier(path, specifierNode.text, known);
      if (!target) continue;
      deps.add(target);
      for (const local of locals) bindings.push({ local, from: target });
    }

    modules.set(path, { path, source, deps, bindings });
  }
  return modules;
}

/** Tarjan. Components of more than one module, each sorted. */
function cycles(graph: ReadonlyMap<string, ReadonlySet<string>>): string[][] {
  let counter = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const found: string[][] = [];

  const visit = (v: string): void => {
    index.set(v, counter);
    low.set(v, counter);
    counter += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, index.get(w)!));
      }
    }
    if (low.get(v) === index.get(v)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      if (component.length > 1) found.push(component.sort());
    }
  };

  for (const v of graph.keys()) if (!index.has(v)) visit(v);
  return found.sort((a, b) => a[0]!.localeCompare(b[0]!));
}

/**
 * Local names this module reads while it loads.
 *
 * "While it loads" means: outside every function body. A function body does not
 * run at import time, which is exactly why a cycle whose only reads are inside
 * one cannot throw. Type positions are skipped — a type annotation is erased
 * before anything evaluates.
 */
function evalTimeReads(source: ts.SourceFile): Set<string> {
  const read = new Set<string>();

  const walk = (node: ts.Node, deferred: boolean): void => {
    // Erased entirely.
    if (
      ts.isTypeNode(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      return;
    }

    // Bodies that do not run at module-evaluation time.
    const defersChildren =
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessor(node) ||
      ts.isSetAccessor(node) ||
      // A non-static class member initialiser runs on construction.
      ((ts.isPropertyDeclaration(node) || ts.isClassDeclaration(node)) &&
        !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword));

    if (ts.isIdentifier(node) && !deferred) {
      const parent = node.parent;
      const isName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isPropertySignature(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && parent.propertyName === node) ||
        (ts.isQualifiedName(parent) && parent.right === node) ||
        ((ts.isVariableDeclaration(parent) ||
          ts.isParameter(parent) ||
          ts.isFunctionDeclaration(parent) ||
          ts.isClassDeclaration(parent)) &&
          parent.name === node);
      if (!isName) read.add(node.text);
    }

    ts.forEachChild(node, (child) => walk(child, deferred || defersChildren));
  };

  ts.forEachChild(source, (child) => walk(child, false));
  return read;
}

const files = sourceFiles();
const modules = parse(files);
const graph = new Map([...modules].map(([p, m]) => [p, m.deps]));
const BARREL = normalize(join('src', 'index.ts'));

describe('import cycles', () => {
  it('has modules to check', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(modules.has(BARREL)).toBe(true);
  });

  it('has no value-level cycle except through the package barrel', () => {
    const withoutBarrel = new Map(
      [...graph].flatMap(([from, deps]) =>
        from === BARREL
          ? []
          : [
              [
                from,
                new Set([...deps].filter((d) => d !== BARREL)),
              ] as [string, Set<string>],
            ],
      ),
    );
    const offenders = cycles(withoutBarrel).filter(
      (c) =>
        !ALLOWED_CYCLES.some(
          (allowed) => allowed.join() === c.join(),
        ),
    );
    expect(
      offenders.map((c) => c.join(' <-> ')),
      'two modules importing values from each other. Move the symbol one of ' +
        'them only declares onto the side the other reads it from — see the ' +
        'module doc for how this shipped as a TDZ ReferenceError.',
    ).toEqual([]);
  });

  it('reads no cycle partner at module-evaluation time', () => {
    const offenders: string[] = [];

    for (const component of cycles(graph)) {
      const inCycle = new Set(component);
      for (const path of component) {
        if (ALLOWED_EVAL_TIME_READS.includes(path)) continue;
        const module = modules.get(path)!;
        const reads = evalTimeReads(module.source);
        for (const binding of module.bindings) {
          if (!inCycle.has(binding.from)) continue;
          if (!reads.has(binding.local)) continue;
          offenders.push(`${path} reads ${binding.local} from ${binding.from}`);
        }
      }
    }

    expect(
      offenders.sort(),
      'a value imported from a module in the same import cycle, read while ' +
        'this module loads. Whichever module the runtime enters first decides ' +
        'whether that binding exists yet: it throws "Cannot access X before ' +
        'initialization" on the other entry point, and nothing catches it at ' +
        'build time. Either move the symbol out of the cycle, or defer the ' +
        'read into a function body.',
    ).toEqual([]);
  });
});
