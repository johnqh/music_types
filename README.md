# @sudobility/music_types

Shared TypeScript types and Zod schemas for the ScoreSmith music platform: the score data model, AI generation contracts, project API payloads, and the standard API response envelope.

## Installation

```bash
bun add @sudobility/music_types
```

## Usage

```ts
import {
  type Score,
  parseScore,
  type GenerateScoreRequest,
  successResponse,
} from '@sudobility/music_types';

const score: Score = parseScore(untrustedJson); // throws ZodError on invalid input
```

## API Summary

- **Score model** — `Score`, `Track`, `Measure`, `Voice`, `NoteEvent`, `RestEvent`, guards `isNoteEvent`/`isRestEvent`
- **Selection/fragments** — `ScoreRange`, `ScoreSelection`, `ScoreFragment`
- **Zod schemas** — `scoreSchema` tree + `parseScore`
- **Generation contracts** — `GenerateScoreRequest`/`GenerateScoreResult`, `RegenerateRegionRequest`/`RegenerateRegionResult`, `MusicGenerationProvider`, with schemas and `parse*` helpers
- **Project API** — `ProjectRecord`, `ProjectSummary`, create/update/list-query types + schemas
- **Envelope** — `ApiResponse<T>`, `successResponse`, `errorResponse`, `API_ERROR_CODES`

## Development

```bash
bun install
bun run verify   # typecheck + lint + test + build
```

## License

BUSL-1.1
