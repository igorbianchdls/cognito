import { Metadata } from 'next'
import AppsGallery from '@/components/apps/AppsGallery'

export const metadata: Metadata = {
  title: 'Apps Gallery | Discover the best apps, components and starters',
  description: 'Browse through a curated collection of apps, components, and starters created by the community. Find inspiration and kickstart your next project.',
  keywords: 'apps, components, starters, templates, dashboard, landing pages, forms, ecommerce',
  openGraph: {
    title: 'Apps Gallery | Discover the best apps, components and starters',
    description: 'Browse through a curated collection of apps, components, and starters created by the community.',
    type: 'website',
    siteName: 'Apps Gallery',
  },
}

export default function AppsPage() {
  return <AppsGallery />
}