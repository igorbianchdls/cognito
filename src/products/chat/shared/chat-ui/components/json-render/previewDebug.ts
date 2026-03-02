"use client";

export type PreviewDebugFlags = {
  safeMode: boolean;
  disableRenderer: boolean;
  disableHeaderActions: boolean;
  disableRefreshListener: boolean;
  disablePathStorage: boolean;
};

function parseBoolLike(value: string | null | undefined): boolean {
  const v = String(value || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function readFlagFromStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return parseBoolLike(window.localStorage.getItem(key));
  } catch {
    return false;
  }
}

export function readPreviewDebugFlags(): PreviewDebugFlags {
  if (typeof window === "undefined") {
    return {
      safeMode: false,
      disableRenderer: false,
      disableHeaderActions: false,
      disableRefreshListener: false,
      disablePathStorage: false,
    };
  }

  const qs = new URLSearchParams(window.location.search);
  const safeMode = parseBoolLike(qs.get("artifact_safe")) || readFlagFromStorage("artifact_safe");
  const disableRenderer =
    safeMode ||
    parseBoolLike(qs.get("artifact_no_renderer")) ||
    readFlagFromStorage("artifact_no_renderer");
  const disableHeaderActions =
    parseBoolLike(qs.get("artifact_no_header_actions")) ||
    readFlagFromStorage("artifact_no_header_actions");
  const disableRefreshListener =
    parseBoolLike(qs.get("artifact_no_refresh_listener")) ||
    readFlagFromStorage("artifact_no_refresh_listener");
  const disablePathStorage =
    parseBoolLike(qs.get("artifact_no_storage")) ||
    readFlagFromStorage("artifact_no_storage");

  return {
    safeMode,
    disableRenderer,
    disableHeaderActions,
    disableRefreshListener,
    disablePathStorage,
  };
}
