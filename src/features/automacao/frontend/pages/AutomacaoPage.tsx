'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'

import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import IdeaCard from '@/features/automacao/frontend/components/IdeaCard'
import {
  ADVANCED_AUTOMATION_IDEAS,
  AUTOMATION_IDEAS,
} from '@/features/automacao/shared/automationIdeas'

export default function AutomacaoPage() {
  const [open, setOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<'daily' | 'interval'>('daily')
  const [time, setTime] = useState<string>('09:30')
  const [days, setDays] = useState<Record<string, boolean>>({
    Seg: true,
    Ter: true,
    Qua: true,
    Qui: true,
    Sex: true,
    Sáb: false,
    Dom: false,
  })

  const toggleDay = (day: string) => {
    setDays((prev) => ({ ...prev, [day]: !prev[day] }))
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto">
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">☁️</div>
            <h1 className="text-3xl font-semibold tracking-tight">Vamos automatizar</h1>
            <p className="text-gray-500">Automatize o trabalho configurando tarefas agendadas</p>
          </div>

          <div className="flex items-center justify-center sm:justify-end mb-6">
            <Button onClick={() => setOpen(true)}>Criar automação</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTOMATION_IDEAS.map((idea) => (
              <IdeaCard key={idea.title} emoji={idea.emoji} title={idea.title} />
            ))}
          </div>

          <div className="mt-12 mb-2 text-center">
            <h2 className="text-xl font-semibold tracking-tight">Exemplos avançados</h2>
            <p className="text-gray-500 text-sm">Orquestrações com múltiplos pontos de contato</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANCED_AUTOMATION_IDEAS.map((idea) => (
              <IdeaCard key={idea.title} emoji={idea.emoji} title={idea.title} />
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="text-gray-500 text-sm hover:text-gray-700">Explorar mais</button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl p-0">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl">Criar automação</DialogTitle>
              </DialogHeader>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Triagem de issues" />
                </div>

                <div className="grid gap-2">
                  <Label>Espaços de trabalho</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha uma pasta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="engineering">Engenharia</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prompt">Instrução</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Todas as manhãs, fazer a triagem de novas issues, sugerir responsáveis e rotular prioridade e área."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Agendamento</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('daily')}
                      className={`h-8 rounded-md border px-3 text-sm ${
                        scheduleType === 'daily'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Diariamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('interval')}
                      className={`h-8 rounded-md border px-3 text-sm ${
                        scheduleType === 'interval'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Intervalo
                    </button>
                  </div>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-60">
                      <Input
                        type="time"
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        className="pr-9"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.keys(days).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`h-8 rounded-full px-2 text-xs font-medium ${
                            days[day] ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                          title={day}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-gray-50/60">
              <div className="flex w-full items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setOpen(false)}>Criar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
