"use client";


import {
    Loader2,
    PackageCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { Dispatch, SetStateAction } from 'react';
import { FulfillItem, SaleRecord } from './salesWorkspaceModel';

// Dialog to register the delivery of the pending products of a sale.
export function SaleFulfillDialog({ fulfillOpen, setFulfillOpen, fulfillSale, fulfillItems, setFulfillItems, saving, fulfill }: {
  fulfillOpen: boolean; setFulfillOpen: Dispatch<SetStateAction<boolean>>; fulfillSale: SaleRecord | null; fulfillItems: FulfillItem[];
  setFulfillItems: Dispatch<SetStateAction<FulfillItem[]>>; saving: boolean; fulfill: () => Promise<void>;
}) {
  return (
      <Dialog open={fulfillOpen} onOpenChange={setFulfillOpen}>
        <DialogContent className="max-w-[min(760px,96vw)]">
          <DialogHeader>
            <DialogTitle>Atender produtos de {fulfillSale?.numero}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Informe as quantidades entregues agora. O saldo restante continuara
            reservado e pendente.
          </p>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto">
            {fulfillItems.map((item) => (
              <div
                key={item.id}
                className="grid items-center gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[1fr_160px]"
              >
                <div>
                  <p className="text-sm font-medium">{item.descricao}</p>
                  <p className="text-xs text-gray-500">
                    Pendente: {item.pendente}
                  </p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={item.pendente}
                  step="0.0001"
                  value={item.quantidade}
                  onChange={(event) =>
                    setFulfillItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, quantidade: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFulfillOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                saving ||
                !fulfillItems.some((item) => Number(item.quantidade) > 0)
              }
              onClick={() => void fulfill()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackageCheck className="size-4" />
              )}
              Confirmar atendimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
