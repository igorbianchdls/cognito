import { PostsView } from '@/products/social/frontend/posts/PostsView'

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const { post } = await searchParams
  return <PostsView key={post ?? 'todos'} openPostId={post} />
}
