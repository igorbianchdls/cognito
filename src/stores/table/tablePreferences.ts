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

// Cell font family
export const $cellFontFamily = atom<string>('Geist');

// Header font family
export const $headerFontFamily = atom<string>('Geist');

// Cell letter spacing
export const $cellLetterSpacing = atom<string>('-0.01em');

// Header letter spacing
export const $headerLetterSpacing = atom<string>('-0.01em');

// Kanban title styles
export const $kanbanTitleColor = atom<string>('#111827'); // gray-900
export const $kanbanTitleSize = atom<number>(14);
export const $kanbanTitleWeight = atom<number>(600); // semibold
export const $kanbanTitleLetterSpacing = atom<string>('-0.01em');

// Kanban name styles
export const $kanbanNameColor = atom<string>('#374151'); // gray-700
export const $kanbanNameSize = atom<number>(12);
export const $kanbanNameWeight = atom<number>(400); // normal
export const $kanbanNameLetterSpacing = atom<string>('0em');

// Kanban title font family
export const $kanbanTitleFontFamily = atom<string>('Geist');

// Kanban name font family
export const $kanbanNameFontFamily = atom<string>('Geist');

// Gallery title styles
export const $galleryTitleColor = atom<string>('#111827'); // gray-900
export const $galleryTitleSize = atom<number>(20); // text-xl
export const $galleryTitleWeight = atom<number>(700); // bold
export const $galleryTitleLetterSpacing = atom<string>('-0.01em');
export const $galleryTitleFontFamily = atom<string>('Geist');

// Gallery label styles
export const $galleryLabelColor = atom<string>('#6b7280'); // gray-500
export const $galleryLabelSize = atom<number>(12); // text-xs
export const $galleryLabelWeight = atom<number>(600); // semibold
export const $galleryLabelLetterSpacing = atom<string>('0.025em'); // tracking-wide
export const $galleryLabelFontFamily = atom<string>('Geist');

// Gallery value styles
export const $galleryValueColor = atom<string>('#374151'); // gray-700
export const $galleryValueSize = atom<number>(14); // text-sm
export const $galleryValueWeight = atom<number>(400); // normal
export const $galleryValueLetterSpacing = atom<string>('0em');
export const $galleryValueFontFamily = atom<string>('Geist');
