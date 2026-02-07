import { redirect } from 'next/navigation'

export default function LegacyModulosCatchAll({ params }: { params: { slug?: string[] } }) {
  const slug = Array.isArray(params?.slug) ? params.slug : []
  const target = slug.length ? `/erp/${slug.join('/')}` : '/erp'
  redirect(target)
}
