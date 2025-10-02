import { atom } from 'nanostores';

// Row height in pixels
export const $rowHeight = atom<number>(40);

// Font size in pixels
export const $fontSize = atom<number>(14);

// Cell text color (hex)
export const $cellTextColor = atom<string>('#111827'); // gray-900

// Header text color (hex)
export const $headerTextColor = atom<string>('#1f2937'); // gray-800
