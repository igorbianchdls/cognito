import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAppById, mockApps } from '@/data/appsData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, GitFork, Heart, Eye, Calendar } from 'lucide-react'

interface AppDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateStaticParams() {
  return mockApps.map((app) => ({
    id: app.id,
  }))
}

export async function generateMetadata({ params }: AppDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const app = getAppById(id)
  
  if (!app) {
    return {
      title: 'App Not Found',
    }
  }

  return {
    title: `${app.title} | Apps Gallery`,
    description: app.description,
    keywords: app.tags.join(', '),
    openGraph: {
      title: app.title,
      description: app.description,
      images: [app.previewImage],
      type: 'website',
    },
  }
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const { id } = await params
  const app = getAppById(id)

  if (!app) {
    notFound()
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return num.toString()
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/apps">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Gallery
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              {app.featured && (
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Featured
                </Badge>
              )}
              {app.trending && (
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                  🔥 Trending
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Image */}
            <Card className="overflow-hidden">
              <div className="aspect-[16/10] bg-gray-100">
                <img
                  src={app.previewImage}
                  alt={app.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this app</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {app.description}
                </p>
                
                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Title and Author */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {app.title}
                </h1>
                
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {app.author.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{app.author.name}</p>
                    <p className="text-sm text-gray-500">@{app.author.username}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {app.demoUrl && (
                    <a href={app.demoUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View Demo
                      </Button>
                    </a>
                  )}
                  
                  {app.sourceUrl && (
                    <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full gap-2">
                        <GitFork className="w-4 h-4" />
                        View Source
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Statistics</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <GitFork className="w-4 h-4" />
                      <span>Forks</span>
                    </div>
                    <span className="font-medium">{formatNumber(app.forks)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="w-4 h-4" />
                      <span>Likes</span>
                    </div>
                    <span className="font-medium">{formatNumber(app.likes)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>Views</span>
                    </div>
                    <span className="font-medium">{formatNumber(app.views)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Information</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>Category</span>
                    </div>
                    <Badge variant="secondary">{app.category}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    <span className="text-gray-900">{formatDate(app.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Updated</span>
                    </div>
                    <span className="text-gray-900">{formatDate(app.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}