import type { FileNode } from './types';

export const fileTreeMock: FileNode[] = [
  {
    id: 'app',
    name: 'app',
    type: 'folder',
    path: 'app',
    children: [
      { id: 'globals.css', name: 'globals.css', type: 'file', path: 'app/globals.css' },
      { id: 'layout.tsx', name: 'layout.tsx', type: 'file', path: 'app/layout.tsx' },
      { id: 'page.tsx', name: 'page.tsx', type: 'file', path: 'app/page.tsx' },
      { id: 'components', name: 'components', type: 'folder', path: 'app/components', children: [] },
    ],
  },
  { id: 'tailwind.config.ts', name: 'tailwind.config.ts', type: 'file', path: 'tailwind.config.ts' },
];

export const fileContentsMock: Record<string, { content: string; language: string }> = {
  'app/layout.tsx': {
    language: 'typescript',
    content: `import type React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App from Mockup',
  description: 'Demo UI'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
`,
  },
  'app/page.tsx': {
    language: 'typescript',
    content: `export default function Page(){
  return <div>Hello</div>
}
`,
  },
  'app/globals.css': {
    language: 'css',
    content: `:root { --foreground: #111; }
body{ margin:0; font-family: ui-sans-serif, system-ui; }
`,
  },
  'tailwind.config.ts': {
    language: 'typescript',
    content: `import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
`,
  },
};

export function languageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

