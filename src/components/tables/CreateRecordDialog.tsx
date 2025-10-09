'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUPABASE_DATASETS, insertSupabaseTableRow } from '@/data/supabaseDatasets';
import { ColDef } from 'ag-grid-community';

interface CreateRecordDialogProps {
  tableName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateRecordDialog({
  tableName,
  open,
  onOpenChange,
  onSuccess
}: CreateRecordDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Encontrar configuração da tabela
  const datasetConfig = SUPABASE_DATASETS.find(ds => ds.tableName === tableName);

  if (!datasetConfig) {
    return null;
  }

  // Filtrar apenas campos editáveis (ignorar IDs auto-gerados e campos não editáveis)
  const editableFields = datasetConfig.columnDefs.filter(
    (col: ColDef) => col.editable !== false && col.field
  );

  // Detectar tipo de input baseado no nome do campo
  const getInputType = (field: string): string => {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('email')) return 'email';
    if (fieldLower.includes('telefone') || fieldLower.includes('phone')) return 'tel';
    if (fieldLower.includes('data') || fieldLower.includes('date')) return 'date';
    if (fieldLower.includes('cpf') || fieldLower.includes('cnpj')) return 'text';
    if (fieldLower.includes('valor') || fieldLower.includes('preco') || fieldLower.includes('salario')) return 'number';
    return 'text';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await insertSupabaseTableRow(tableName, formData);
      setFormData({});
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao criar registro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar {datasetConfig.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {editableFields.map((col: ColDef) => {
              const field = col.field || '';
              const inputType = getInputType(field);

              return (
                <div key={field} className="flex flex-col gap-2">
                  <Label htmlFor={field}>
                    {col.headerName || field}
                  </Label>
                  <Input
                    id={field}
                    type={inputType}
                    value={(formData[field] as string) || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={`Digite ${col.headerName?.toLowerCase() || field}`}
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
