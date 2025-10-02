import { persistentAtom } from '@nanostores/persistent';

// Row height in pixels
export const $rowHeight = persistentAtom<number>('table-row-height', 40);

// Font size in pixels
export const $fontSize = persistentAtom<number>('table-font-size', 14);

// Cell text color (hex)
export const $cellTextColor = persistentAtom<string>('table-cell-text-color', '#111827'); // gray-900

// Header text color (hex)
export const $headerTextColor = persistentAtom<string>('table-header-text-color', '#1f2937'); // gray-800
