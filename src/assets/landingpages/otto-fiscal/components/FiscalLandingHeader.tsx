'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { fiscalNavigation } from '@/assets/landingpages/otto-fiscal/fiscalLandingContent'

export function FiscalLandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#e3e7e4] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/emissor-nota-fiscal" className="inline-flex items-center gap-2.5" aria-label="Otto Fiscal, página inicial">
          <Image src="/logoOttoIcon.svg" alt="" width={22} height={22} priority />
          <span className="text-[21px] font-medium leading-none text-[#181b19]">Otto</span>
          <span className="hidden border-l border-[#dfe3df] pl-2.5 text-xs font-medium text-[#68706a] sm:inline">Nota fiscal</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {fiscalNavigation.map((item) => (
            <a key={item.href} href={item.href} className="text-[13px] font-medium text-[#626a64] transition-colors hover:text-[#181b19]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/sign-in" className="inline-flex h-10 items-center justify-center px-3 text-sm font-medium text-[#3d433e] hover:text-[#181b19]">
            Entrar
          </Link>
          <Link href="/sign-up" className="inline-flex h-10 items-center justify-center rounded-md bg-[#17653a] px-4 text-sm font-medium text-white transition-colors hover:bg-[#11542f]">
            Começar a emitir
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-[#3d433e] hover:bg-[#f2f5f2] lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e3e7e4] bg-white px-5 py-5 lg:hidden">
          <nav aria-label="Navegação móvel" className="mx-auto grid max-w-[1180px] gap-1">
            {fiscalNavigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-[#444b46] hover:bg-[#f3f5f3]">
                {item.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e3e7e4] pt-4">
              <Link href="/sign-in" className="inline-flex h-11 items-center justify-center rounded-md border border-[#d5dad6] text-sm font-medium text-[#303630]">Entrar</Link>
              <Link href="/sign-up" className="inline-flex h-11 items-center justify-center rounded-md bg-[#17653a] text-sm font-medium text-white">Começar</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
