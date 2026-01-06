// Tailwind v4 config: safelist dynamic classes coming from DSL
export default {
  safelist: [
    // Common spacing utilities used via DSL class attributes
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5',
    'pt-2', 'pt-3', 'pt-4', 'pt-5',
    'pb-2', 'pb-3', 'pb-4', 'pb-5',
  ],
} satisfies import('tailwindcss').Config;

