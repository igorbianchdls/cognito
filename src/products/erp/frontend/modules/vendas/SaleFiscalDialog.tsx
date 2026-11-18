"use client";


import {
    Loader2
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { Dispatch, SetStateAction } from 'react';

// Result of the fiscal pre-validation of a sale.
export function SaleFiscalDialog({ fiscalOpen, setFiscalOpen, fiscalLoading, fiscalResult }: {
  fiscalOpen: boolean; setFiscalOpen: Dispatch<SetStateAction<boolean>>; fiscalLoading: boolean;
  fiscalResult: { ready: boolean; issues: Array<{ code: string; field: string; message: string; severity: 'error' | 'warning' }> } | null;
}) {
  return (
      <Dialog open={fiscalOpen} onOpenChange={setFiscalOpen}><DialogContent className="max-w-[min(720px,96vw)]"><DialogHeader><DialogTitle>Pre-validação fiscal</DialogTitle></DialogHeader>{fiscalLoading ? <div className="py-16 text-center text-sm text-gray-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Validando cadastros e itens...</div> : fiscalResult ? <div className="grid gap-4"><div className={`rounded-md border px-4 py-3 text-sm ${fiscalResult.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{fiscalResult.ready ? 'A venda possui os dados minimos para a futura emissão fiscal.' : 'Existem campos que precisam ser corrigidos antes da emissão.'}</div><div className="grid gap-2">{fiscalResult.issues.map((issue) => <div key={`${issue.code}-${issue.field}`} className="grid grid-cols-[80px_1fr] gap-3 border-b py-3"><span className={`text-xs font-medium uppercase ${issue.severity === 'error' ? 'text-rose-600' : 'text-amber-600'}`}>{issue.severity === 'error' ? 'Impeditivo' : 'Aviso'}</span><div><p className="text-sm text-gray-900">{issue.message}</p><p className="mt-1 text-xs text-gray-500">{issue.field}</p></div></div>)}</div></div> : null}</DialogContent></Dialog>
  );
}
