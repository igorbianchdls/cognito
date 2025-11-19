"use client";

import { atom } from 'nanostores';

export type Insight2Variant = 'risk' | 'slow' | 'info' | 'custom';

export interface Insight2Link {
  text: string;
  url?: string;
}

export interface Insight2Item {
  id: string;
  variant?: Insight2Variant;
  icon?: string;
  label: string;
  link?: Insight2Link;
  tail?: string;
}

export interface Insights2WidgetState {
  items: Insight2Item[];
}

export type Insights2State = Record<string /* dashboardId */, Record<string /* widgetId */, Insights2WidgetState>>;

const initial: Insights2State = {};

export const $insights2 = atom<Insights2State>(initial);

function ensurePaths(dashboardId: string, widgetId: string) {
  const current = $insights2.get();
  if (!current[dashboardId]) current[dashboardId] = {};
  if (!current[dashboardId][widgetId]) current[dashboardId][widgetId] = { items: [] };
}

export const insights2Actions = {
  getItems(dashboardId: string, widgetId: string): Insight2Item[] {
    const state = $insights2.get();
    return state[dashboardId]?.[widgetId]?.items || [];
  },
  setItems(dashboardId: string, widgetId: string, items: Insight2Item[]) {
    const current = { ...$insights2.get() };
    if (!current[dashboardId]) current[dashboardId] = {};
    current[dashboardId][widgetId] = { items: items.slice() };
    $insights2.set(current);
  },
  addItem(dashboardId: string, widgetId: string, item: Insight2Item) {
    ensurePaths(dashboardId, widgetId);
    const current = { ...$insights2.get() };
    const existing = current[dashboardId][widgetId].items.slice();
    existing.push(item);
    current[dashboardId][widgetId] = { items: existing };
    $insights2.set(current);
  },
  updateItem(dashboardId: string, widgetId: string, itemId: string, patch: Partial<Insight2Item>) {
    ensurePaths(dashboardId, widgetId);
    const current = { ...$insights2.get() };
    const list = current[dashboardId][widgetId].items.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
    current[dashboardId][widgetId] = { items: list };
    $insights2.set(current);
  },
  removeItem(dashboardId: string, widgetId: string, itemId: string) {
    ensurePaths(dashboardId, widgetId);
    const current = { ...$insights2.get() };
    const list = current[dashboardId][widgetId].items.filter((it) => it.id !== itemId);
    current[dashboardId][widgetId] = { items: list };
    $insights2.set(current);
  },
  clear(dashboardId: string, widgetId: string) {
    ensurePaths(dashboardId, widgetId);
    const current = { ...$insights2.get() };
    current[dashboardId][widgetId] = { items: [] };
    $insights2.set(current);
  },
};

