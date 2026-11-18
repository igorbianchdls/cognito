"use client";


import {
    Check,
    Eye,
    FileCheck2,
    Loader2,
    PackageCheck,
    Pencil,
    Send,
    ShieldCheck,
    Undo2,
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

import { SaleRecord, currency } from './salesWorkspaceModel';

// Table of sales or quotes with the actions of each row.
export function SalesTable({ records, loading, isQuote, canManage, page, totalRecords, setPage, openDetails, openFiscalPreflight, openEdit, runQuoteAction, runAction, openFulfill }: {
  records: SaleRecord[]; loading: boolean; isQuote: boolean; canManage: boolean; page: number; totalRecords: number;
  setPage: (page: number) => void;
  openDetails: (record: SaleRecord) => Promise<void>; openFiscalPreflight: (record: SaleRecord) => Promise<void>;
  openEdit: (record: SaleRecord) => Promise<void>; openFulfill: (record: SaleRecord) => Promise<void>;
  runQuoteAction: (record: SaleRecord, action: "enviar" | "aprovar" | "recusar" | "cancelar" | "converter") => Promise<void>;
  runAction: (record: SaleRecord, action: "confirmar" | "cancelar") => Promise<void>;
}) {
  return (
      <div className="min-h-[300px] min-w-0 flex-1 overflow-x-auto">
        <Table className="erp-workspace-table min-w-[1240px] border-b border-[#e7e7e4]">
          <TableHeader>
            <TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]">
              <TableHead>Número</TableHead>
              <TableHead className="erp-table-identity-heading">Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>{isQuote ? "Validade" : "Data"}</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Situação</TableHead>
              {!isQuote ? <TableHead>Atendimento</TableHead> : null}
              {!isQuote ? <TableHead>Fiscal</TableHead> : null}
              <TableHead className="w-64" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={isQuote ? 7 : 9}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isQuote ? 7 : 9}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhum {isQuote ? "orcamento" : "pedido"} encontrado.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell><button type="button" className="font-medium text-[#245ea6] hover:underline" onClick={() => void openDetails(record)}>{record.numero}</button></TableCell>
                  <TableCell><ErpRecordIdentity name={record.descricao} category={record.categoria} identityKey={'venda:' + record.id} icon={<FileCheck2 className="size-5" />} /></TableCell>
                  <TableCell>{record.cliente}</TableCell>
                  <TableCell>
                    {formatErpValue(isQuote ? record.validade : record.data)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {currency(record.total)}
                  </TableCell>
                  <TableCell>
                    <ErpStatusBadge status={isQuote && record.status !== 'cancelada' ? record.situacao : record.status} />
                  </TableCell>
                  {!isQuote ? <TableCell><ErpStatusBadge status={record.atendimento_status} label={record.atendimento_status === 'parcial' ? 'Parcial' : undefined} /></TableCell> : null}
                  {!isQuote ? <TableCell><ErpStatusBadge status={record.fiscal_status} /></TableCell> : null}
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
                      {!isQuote ? <Button size="icon" variant="ghost" title="Pre-validação fiscal" onClick={() => void openFiscalPreflight(record)}><ShieldCheck className="size-4" /></Button> : null}
                      {!isQuote && canManage && !["rascunho", "cancelada", "cancelado"].includes(record.status) ? <Button size="icon" variant="ghost" title="Registrar devolução" aria-label="Registrar devolução" onClick={() => { window.location.href = `/erp/vendas/devolucoes?venda=${record.id}` }}><Undo2 className="size-4" /></Button> : null}
                      {canManage ? (
                        <>
                          {record.status === "rascunho" && (!isQuote || !["recusado","cancelado","convertido"].includes(record.situacao)) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title={
                                isQuote ? "Editar orçamento" : "Editar venda"
                              }
                              onClick={() => void openEdit(record)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {isQuote ? (
                            <>
                              {["em_andamento","enviada"].includes(record.situacao) ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Registrar envio"
                                  onClick={() =>
                                    void runQuoteAction(record, "enviar")
                                  }
                                >
                                  <Send className="size-4" />
                                </Button>
                              ) : null}
                              {["em_andamento","enviada"].includes(record.situacao) ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Aprovar"
                                  onClick={() =>
                                    void runQuoteAction(record, "aprovar")
                                  }
                                >
                                  <Check className="size-4" />
                                </Button>
                              ) : null}
                              {record.situacao === "aprovado" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Converter em venda"
                                  onClick={() =>
                                    void runQuoteAction(record, "converter")
                                  }
                                >
                                  <FileCheck2 className="size-4" />
                                </Button>
                              ) : null}
                              {!["recusado","cancelado","convertido"].includes(record.situacao) &&
                              record.status !== "cancelada" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Recusar"
                                  onClick={() =>
                                    void runQuoteAction(record, "recusar")
                                  }
                                >
                                  <X className="size-4" />
                                </Button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {record.status === "rascunho" && (!isQuote || !["recusado","cancelado","convertido"].includes(record.situacao)) ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Confirmar venda"
                                  onClick={() =>
                                    void runAction(record, "confirmar")
                                  }
                                >
                                  <Check className="size-4" />
                                </Button>
                              ) : null}
                              {record.status === "confirmada" && ["pendente", "parcial"].includes(record.atendimento_status) ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Registrar atendimento"
                                  onClick={() => void openFulfill(record)}
                                >
                                  <PackageCheck className="size-4" />
                                </Button>
                              ) : null}
                              {record.status !== "cancelada" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Cancelar venda"
                                  onClick={() =>
                                    void runAction(record, "cancelar")
                                  }
                                >
                                  <X className="size-4" />
                                </Button>
                              ) : null}
                            </>
                          )}
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
