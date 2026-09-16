/**
 * A toast: a transient message a store raises and a host renders.
 */

export type ToastSeverity = "info" | "success" | "warning" | "error";

/**
 * An optional action button (spec §28: "retry actions where appropriate"),
 * e.g. "Retry" on a failed import/save toast, or "Undo" on a paste refused
 * after a cut. The toast is dismissed once it is used, so `onClick` does only
 * the work.
 */
export type ToastAction = { label: string; onClick: () => void };

export type Toast = {
  id: string;
  message: string;
  severity: ToastSeverity;
  action?: ToastAction;
};

/**
 * A host's toast renderer.
 *
 * The toast arrives with its id already assigned, because the store's caller
 * is handed that id back — a refused paste's Undo action dismisses its own
 * toast by it.
 */
export type ToastSink = {
  push(toast: Toast): void;
  dismiss(id: string): void;
};
