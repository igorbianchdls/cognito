'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { landingNavigation } from '@/assets/landingpages/otto/landingContent'

export function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e7e3] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/lp" className="inline-flex items-center gap-2.5" aria-label="Otto, página inicial">
          <Image src="/logoOttoIcon.svg" alt="" width={22} height={22} priority />
          <span className="text-[21px] font-medium leading-none text-[#181818]">Otto</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {landingNavigation.map((item) => (
            <a key={item.href} href={item.href} className="text-[13px] font-medium text-[#626862] transition-colors hover:text-[#181818]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/sign-in" className="inline-flex h-10 items-center justify-center px-3 text-sm font-medium text-[#383b38] hover:text-[#181818]">
            Entrar
          </Link>
          <Link href="/sign-up" className="inline-flex h-10 items-center justify-center rounded-md bg-[#181818] px-4 text-sm font-medium text-white transition-colors hover:bg-[#303030]">
            Começar agora
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-[#383b38] hover:bg-[#f3f4f2] lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e4e7e3] bg-white px-5 py-5 lg:hidden">
          <nav aria-label="Navegação móvel" className="mx-auto grid max-w-[1180px] gap-1">
            {landingNavigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-[#444944] hover:bg-[#f4f5f3]">
                {item.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e4e7e3] pt-4">
              <Link href="/sign-in" className="inline-flex h-11 items-center justify-center rounded-md border border-[#daddd9] text-sm font-medium text-[#303330]">Entrar</Link>
              <Link href="/sign-up" className="inline-flex h-11 items-center justify-center rounded-md bg-[#181818] text-sm font-medium text-white">Começar agora</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
