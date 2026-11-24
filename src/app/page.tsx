import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { empresasDaPessoa } from '@/products/plataforma/server/empresa'
import { inicioPorCategoria } from '@/products/plataforma/shared/categorias'

/** "/" opens where the active company's category starts: the Editor for Marketing, the ERP for Gestão and Completo. */
export default async function Home() {
  const { userId, orgId } = await auth()
  let destino = '/erp'
  if (userId) {
    const empresas = await empresasDaPessoa(userId).catch(() => [])
    const ativa = empresas.find(e => e.organizacao === orgId) ?? (orgId ? undefined : empresas[0])
    if (ativa) destino = inicioPorCategoria[ativa.categoria]
  }
  redirect(destino)
}
