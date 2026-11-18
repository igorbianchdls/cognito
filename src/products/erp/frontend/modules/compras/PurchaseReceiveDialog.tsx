"use client";


import {
    Loader2,
    PackageCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { Dispatch, SetStateAction } from 'react';
import { PurchaseCatalogs, PurchaseRecord, ReceiveItem } from './purchaseWorkspaceModel';

// Dialog to receive the pending products of a purchase into stock.
export function PurchaseReceiveDialog({ catalogs, receiveOpen, setReceiveOpen, receivePurchase, receiveItems, setReceiveItems, saving, receive }: {
  catalogs: PurchaseCatalogs;
  receiveOpen: boolean;
  setReceiveOpen: Dispatch<SetStateAction<boolean>>;
  receivePurchase: PurchaseRecord | null;
  receiveItems: ReceiveItem[];
  setReceiveItems: Dispatch<SetStateAction<ReceiveItem[]>>;
  saving: boolean;
  receive: () => Promise<void>;
}) {
  return (
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-[min(820px,96vw)]">
          <DialogHeader>
            <DialogTitle>
              Receber produtos de {receivePurchase?.numero}
            </DialogTitle>
            <DialogDescription>Registre as quantidades recebidas e o local de entrada dos produtos.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Informe somente as quantidades recebidas agora. O saldo restante
            continuara pendente.
          </p>
          <div className="grid max-h-[58vh] gap-2 overflow-y-auto">
            {receiveItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[1fr_150px_220px]"
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
                    setReceiveItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, quantidade: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
                <select
                  className="h-10 rounded-md bg-white px-3 text-sm"
                  value={item.localEstoqueId}
                  onChange={(event) =>
                    setReceiveItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, localEstoqueId: event.target.value }
                          : row,
                      ),
                    )
                  }
                >
                  <option value="">Selecione o local</option>
                  {catalogs.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.nome}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                saving ||
                !receiveItems.some(
                  (item) => Number(item.quantidade) > 0 && item.localEstoqueId,
                )
              }
              onClick={() => void receive()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackageCheck className="size-4" />
              )}
              Confirmar recebimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
