import { atom } from 'nanostores';

// Row height in pixels (data cells)
export const $rowHeight = atom<number>(40);

// Header row height in pixels
export const $headerRowHeight = atom<number>(40);

// Cell font size in pixels
export const $fontSize = atom<number>(14);

// Header font size in pixels (separate from cell)
export const $headerFontSize = atom<number>(14);

// Cell text color (hex)
export const $cellTextColor = atom<string>('#111827'); // gray-900

// Header text color (hex)
export const $headerTextColor = atom<string>('#1f2937'); // gray-800
