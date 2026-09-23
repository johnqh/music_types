/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

/**
 * A single bundled file per entry, matching entity_pages' pattern rather than
 * the many-file `tsc` output every other `music_*` package still uses — see
 * that family's own CLAUDE.md for why the two conventions coexist. `tsc`
 * (plain `tsconfig.json`, `noEmit: true`) is still the type-check gate; this
 * is the only thing that actually emits `dist/`.
 *
 * Two entries, not one: `./test` is a real, separately-imported subpath —
 * every package in the family that needs a score fixture imports it
 * (`@sudobility/music_types/test`) rather than restating one, so collapsing
 * it into the main bundle would break every one of those imports.
 */
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'test/fixtures': resolve(__dirname, 'src/test/fixtures.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['immer', 'zod', '@sudobility/types'],
      output: {
        exports: 'named',
      },
    },
  },
});
