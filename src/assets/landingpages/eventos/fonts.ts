import localFont from 'next/font/local';

export const serif = localFont({ src: [{ path: '../../../fonts/cormorant-garamond-500.woff2', weight: '500', style: 'normal' }, { path: '../../../fonts/cormorant-garamond-600.woff2', weight: '600', style: 'normal' }], variable: '--font-velia-serif', display: 'swap' });
