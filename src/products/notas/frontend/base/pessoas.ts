'use client'

import { useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'

export type Pessoa = { id: string; nome: string; foto: string | null }

/** Pessoas da empresa (Clerk), para a propriedade "Pessoa" e para "Criado por"/"Editado por". */
export function usePessoas(): Pessoa[] {
  const { memberships } = useOrganization({ memberships: { pageSize: 100, keepPreviousData: true } })
  return useMemo(() => (memberships?.data ?? []).flatMap(m => {
    const u = m.publicUserData
    if (!u?.userId) return []
    const nome = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.identifier || 'Pessoa'
    return [{ id: u.userId, nome, foto: u.imageUrl ?? null }]
  }), [memberships?.data])
}
