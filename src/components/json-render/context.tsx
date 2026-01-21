"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type AnyRecord = Record<string, any>;

function getValueByPath(data: AnyRecord, path: string, fallback?: any): any {
  if (!path) return fallback;
  try {
    const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
    let curr: any = data;
    for (const p of parts) {
      if (curr == null) return fallback;
      curr = curr[p];
    }
    return curr === undefined ? fallback : curr;
  } catch {
    return fallback;
  }
}

type DataContextType = {
  data: AnyRecord;
  setData: React.Dispatch<React.SetStateAction<AnyRecord>>;
  mergeData: (partial: AnyRecord) => void;
  getValueByPath: (path: string, fallback?: any) => any;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ initialData, children }: { initialData?: AnyRecord; children: React.ReactNode }) {
  const [data, setData] = useState<AnyRecord>(initialData || {});
  const ctx = useMemo<DataContextType>(() => ({
    data,
    setData,
    mergeData: (partial: AnyRecord) => setData((prev) => ({ ...(prev || {}), ...(partial || {}) })),
    getValueByPath: (path: string, fallback?: any) => getValueByPath(data, path, fallback),
  }), [data]);
  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    // Provide a harmless fallback outside of provider
    return {
      data: {},
      setData: (() => { /* noop */ }) as React.Dispatch<React.SetStateAction<AnyRecord>>,
      mergeData: () => {},
      getValueByPath: (_: string, fallback?: any) => fallback,
      __missingProvider: true as const,
    } as any;
  }
  return ctx;
}

export function useDataValue(path: string, fallback?: any) {
  const ctx = useContext(DataContext);
  if (!ctx) return fallback;
  return ctx.getValueByPath(path, fallback);
}

