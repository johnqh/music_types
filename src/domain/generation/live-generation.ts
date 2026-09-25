/**
 * Folding a live-generation stream into a score — the one reducer both
 * clients and the server's own tests use, so "the client's score after
 * `complete` equals `GET /projects/:id`" is a property of one function rather
 * than an agreement between three.
 *
 * Pure: `(state, message) -> state`. A message that changes nothing returns
 * the same state object, which is what lets a caller skip a render on it —
 * a duplicate `seq`, a `heartbeat`, or a `fragment` that arrived before any
 * `snapshot` (recorded as nothing; the snapshot a reconnect brings resyncs
 * the whole score, so a fragment without a base is safely dropped).
 */
import type {
  GenerationJob,
  GenerationRecord,
  LiveGenerationMessage,
  LiveGenerationProgress,
  ProjectStatus,
  Score,
  ScoreRange,
} from "../../index";
import { replaceFragment } from "../score/fragment";

export type LiveGenerationPhase =
  | "waiting"
  | "live"
  | "complete"
  | "failed"
  | "cancelled"
  | "error";

export type LiveGenerationState = {
  phase: LiveGenerationPhase;
  /** The last sequence number applied; -1 before any. */
  lastSeq: number;
  /** null until the snapshot. */
  score: Score | null;
  /** The server's `updatedAt` for `score`, from the snapshot or the terminal message. */
  updatedAt: string | null;
  /** The project's status as the stream last reported it; null before the snapshot. */
  status: ProjectStatus | null;
  job: GenerationJob | null;
  progress: LiveGenerationProgress | null;
  /** Every range a fragment wrote, in arrival order — what to highlight at the end. */
  touched: readonly ScoreRange[];
  error: { code: string; message: string } | null;
  /** Why a `failed` stream failed, from the job or the project. */
  failure: string | null;
  lastGeneration?: GenerationRecord;
};

export const INITIAL_LIVE_GENERATION_STATE: LiveGenerationState = {
  phase: "waiting",
  lastSeq: -1,
  score: null,
  updatedAt: null,
  status: null,
  job: null,
  progress: null,
  touched: [],
  error: null,
  failure: null,
};

/**
 * One message's effect on a score. `fragment` is `replaceFragment` — the same
 * call the server made before sending it; a snapshot or a terminal message
 * carries the whole score and replaces it; anything else leaves it alone.
 */
export function mergeLiveScore(
  score: Score,
  message: LiveGenerationMessage,
): Score {
  switch (message.type) {
    case "fragment":
      return replaceFragment(score, message.fragment);
    case "snapshot":
    case "complete":
    case "failed":
    case "cancelled":
      return message.score;
    default:
      return score;
  }
}

/** Sequence-aware fold. See the module doc for what returns `state` unchanged. */
export function applyLiveGenerationMessage(
  state: LiveGenerationState,
  message: LiveGenerationMessage,
): LiveGenerationState {
  if (message.type === "heartbeat") return state;
  if (message.type === "error") {
    return {
      ...state,
      phase: "error",
      error: { code: message.code, message: message.message },
    };
  }
  // Duplicates and stragglers: a snapshot may be followed by a fragment it
  // already contains, and a reconnect may replay. At-or-below is ignored.
  if (message.seq <= state.lastSeq) return state;

  switch (message.type) {
    case "snapshot":
      return {
        ...state,
        phase: "live",
        lastSeq: message.seq,
        score: message.score,
        updatedAt: message.updatedAt,
        status: message.status,
        job: message.job,
      };
    case "fragment": {
      if (!state.score) return state;
      return {
        ...state,
        lastSeq: message.seq,
        score: replaceFragment(state.score, message.fragment),
        touched: [...state.touched, message.fragment.range],
      };
    }
    case "progress":
      return {
        ...state,
        lastSeq: message.seq,
        progress: {
          stage: message.stage,
          label: message.label,
          done: message.done,
          total: message.total,
        },
      };
    case "complete":
      return {
        ...state,
        phase: "complete",
        lastSeq: message.seq,
        score: message.score,
        updatedAt: message.updatedAt,
        status: "ready",
        job: message.job,
        progress: null,
        ...(message.lastGeneration
          ? { lastGeneration: message.lastGeneration }
          : {}),
      };
    case "failed":
    case "cancelled":
      return {
        ...state,
        phase: message.type,
        lastSeq: message.seq,
        score: message.score,
        updatedAt: message.updatedAt,
        status: "ready",
        job: message.job,
        progress: null,
        failure:
          message.type === "failed"
            ? (message.error ?? message.job?.error ?? "Generation failed.")
            : null,
      };
  }
}
