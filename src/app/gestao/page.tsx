'use client';

import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function GestaoPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Gestão</h1>
          <p className="text-muted-foreground">Selecione um schema e uma tabela no menu lateral</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
