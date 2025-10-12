'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

type SqlEntry = { name?: string; sql: string; params?: unknown[] };

interface GenericResultTableProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
  sql_queries?: SqlEntry[];
  exportFileName?: string;
  pageSize?: number;
}

const isDateKey = (key: string) => /(^|_)data($|_)|(^|_)(date|dia|timestamp)($|_)/i.test(key);
const isMoneyKey = (key: string) => /(valor|total|custo|receita|despesa|resultado|preco|price|revenue|amount)/i.test(key);
const isPercentKey = (key: string) => /(percent|taxa|rate)/i.test(key);

export default function GenericResultTable({
  title,
  icon,
  iconColor,
  success,
  message,
  rows = [],
  count,
  sql_query,
  sql_queries,
  exportFileName = 'results',
  pageSize = 20,
}: GenericResultTableProps) {
  const data = rows ?? [];
  const effectiveCount = typeof count === 'number' ? count : data.length;

  const combinedSql = useMemo(() => {
    if (sql_queries && sql_queries.length > 0) {
      const blocks = sql_queries.map((q) => {
        const title = q.name ? `-- ${q.name}\n` : '';
        const params = q.params && Array.isArray(q.params) ? `\n/* params: ${JSON.stringify(q.params)} */` : '';
        return `${title}${q.sql.trim()}${params}`;
      });
      return blocks.join('\n\n');
    }
    return sql_query;
  }, [sql_query, sql_queries]);

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    if (!data || data.length === 0) return [
      { accessorKey: 'info', header: 'Info' },
    ];

    const sample = data[0];
    return Object.keys(sample).map((key) => {
      return {
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        cell: ({ row }) => {
          const value = row.getValue(key) as unknown;

          if (value == null) return '-';

          if (typeof value === 'number') {
            if (isPercentKey(key)) {
              return `${Number(value).toFixed(2)}%`;
            }
            if (isMoneyKey(key)) {
              return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
            }
            return Number(value).toLocaleString('pt-BR');
          }

          if (typeof value === 'string') {
            if (isDateKey(key)) {
              const d = new Date(value);
              return isNaN(d.getTime()) ? value : d.toLocaleString('pt-BR');
            }
            return value;
          }

          if (typeof value === 'boolean') {
            return value ? 'Sim' : 'Não';
          }

          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        },
      } as ColumnDef<Record<string, unknown>>;
    });
  }, [data]);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title={title}
      icon={icon}
      iconColor={iconColor}
      message={message}
      success={success}
      count={effectiveCount}
      exportFileName={exportFileName}
      pageSize={pageSize}
      sqlQuery={combinedSql}
    />
  );
}

