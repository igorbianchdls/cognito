"use client";


import {
    Check,
    Eye,
    Loader2,
    PackageCheck,
    Pencil,
    X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ErpPagination } from "@/products/erp/frontend/components/ErpPagination";
import { ErpRecordIdentity } from '@/products/erp/frontend/components/ErpRecordIdentity';
import { ErpStatusBadge } from "@/products/erp/frontend/components/ErpWorkspaceChrome";
import { formatErpValue } from "@/products/erp/frontend/services/erpProfessionalClient";

import type { Dispatch, SetStateAction } from 'react';
import { PurchaseRecord, formatCurrency, movementLabel } from './purchaseWorkspaceModel';

// Table of purchases with the actions of each row.
export function PurchasesTable({ canManage, canReturn, records, page, setPage, totalRecords, loading, returnPurchase, runAction, openDetails, openReceive, openEdit }: {
  canManage: boolean;
  canReturn: boolean;
  records: PurchaseRecord[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  totalRecords: number;
  loading: boolean;
  returnPurchase: (record: PurchaseRecord) => Promise<void>;
  runAction: (record: PurchaseRecord, action: "confirmar" | "cancelar") => Promise<void>;
  openDetails: (record: PurchaseRecord) => Promise<void>;
  openReceive: (record: PurchaseRecord) => Promise<void>;
  openEdit: (record: PurchaseRecord) => Promise<void>;
}) {
  return (
      <div className="min-h-[300px] min-w-0 flex-1 overflow-x-auto">
        <Table className="erp-workspace-table min-w-[1240px] border-b border-[#e7e7e4]">
          <TableHeader>
            <TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]">
              <TableHead>Número</TableHead>
              <TableHead className="erp-table-identity-heading">Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Movimento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Financeiro</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhuma compra encontrada.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell><button type="button" className="font-medium text-[#245ea6] hover:underline" onClick={() => void openDetails(record)}>{record.numero}</button></TableCell>
                  <TableCell><ErpRecordIdentity name={record.descricao} category={record.categoria} identityKey={'compra:' + record.id} icon={<PackageCheck className="size-5" />} /></TableCell>
                  <TableCell>{record.fornecedor}</TableCell>
                  <TableCell>
                    <ErpStatusBadge status={record.tipo_movimento} label={record.devolvida ? 'Devolvida ao fornecedor' : movementLabel(record.tipo_movimento)} />
                  </TableCell>
                  <TableCell>{formatErpValue(record.data)}</TableCell>
                  <TableCell>{record.entrega || "-"}</TableCell>
                  <TableCell>{record.financeiro}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(record.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Ver detalhes"
                        onClick={() => void openDetails(record)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canManage ? (
                        <>
                          {record.tipo_movimento === "cotacao" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Editar cotacao"
                              onClick={() => void openEdit(record)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {!["compra", "cancelada"].includes(
                            record.tipo_movimento,
                          ) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Confirmar compra"
                              onClick={() =>
                                void runAction(record, "confirmar")
                              }
                            >
                              <Check className="size-4" />
                            </Button>
                          ) : null}
                          {record.tipo_movimento === "compra" &&
                          ["confirmada", "parcialmente_recebida"].includes(
                            record.status,
                          ) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Registrar recebimento"
                              onClick={() => void openReceive(record)}
                            >
                              <PackageCheck className="size-4" />
                            </Button>
                          ) : null}
                          {canReturn && record.tipo_movimento === 'compra' && record.status === 'recebida' && record.tipo_compra === 'produto' && <Button size="sm" variant="outline" onClick={() => void returnPurchase(record)}>Devolver ao fornecedor</Button>}
                          {record.tipo_movimento !== "cancelada" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cancelar"
                              onClick={() => void runAction(record, "cancelar")}
                            >
                              <X className="size-4" />
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-5 py-3 md:px-8 lg:px-10"><ErpPagination
          page={page}
          pageSize={50}
          total={totalRecords}
          onPageChange={setPage}
        /></div>
      </div>
  );
}
