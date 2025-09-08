'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, TableData } from '@/components/widgets/Table';

interface Campaign extends TableData {
  campaign_id: string;
  campaign_name: string;
  account_name: string;
  days_active: number;
  total_impressions: number;
  total_spend: number;
  total_clicks: number;
  ctr: number;
  cpc: number;
}

interface CampaignsListProps {
  campaigns?: Campaign[];
  success?: boolean;
  tableName?: string;
  datasetId?: string;
  projectId?: string;
  totalCampaigns?: number;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  error?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString('pt-BR');
};

const campaignColumns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'campaign_name',
    header: 'Nome da Campanha',
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div className="font-medium text-gray-900 truncate" title={row.getValue('campaign_name')}>
          {row.getValue('campaign_name')}
        </div>
        <div className="text-sm text-gray-500 truncate" title={row.getValue('account_name')}>
          {row.getValue('account_name')}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'total_impressions',
    header: 'Impressões',
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        {formatNumber(row.getValue('total_impressions'))}
      </span>
    ),
  },
  {
    accessorKey: 'total_clicks',
    header: 'Cliques',
    cell: ({ row }) => (
      <span className="font-medium text-green-600">
        {formatNumber(row.getValue('total_clicks'))}
      </span>
    ),
  },
  {
    accessorKey: 'total_spend',
    header: 'Gasto',
    cell: ({ row }) => (
      <span className="font-medium text-red-600">
        {formatCurrency(row.getValue('total_spend'))}
      </span>
    ),
  },
  {
    accessorKey: 'ctr',
    header: 'CTR',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {row.getValue('ctr')}%
      </span>
    ),
  },
  {
    accessorKey: 'cpc',
    header: 'CPC',
    cell: ({ row }) => (
      <span className="font-medium text-orange-600">
        {formatCurrency(row.getValue('cpc'))}
      </span>
    ),
  },
  {
    accessorKey: 'days_active',
    header: 'Dias Ativos',
    cell: ({ row }) => (
      <span className="text-gray-600">
        {row.getValue('days_active')} dias
      </span>
    ),
  },
];

export default function CampaignsList({ 
  campaigns = [], 
  success = true, 
  tableName,
  datasetId,
  projectId,
  totalCampaigns,
  dateRange,
  error 
}: CampaignsListProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">Erro ao obter campanhas:</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">Não foi possível obter as campanhas.</p>
      </div>
    );
  }

  const dateRangeText = dateRange?.startDate || dateRange?.endDate 
    ? `${dateRange.startDate || 'início'} até ${dateRange.endDate || 'hoje'}`
    : 'todos os períodos';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Campanhas Meta Ads
          </h3>
          <p className="text-sm text-gray-600">
            {projectId}.{datasetId}.{tableName} • {totalCampaigns} campanhas • {dateRangeText}
          </p>
        </div>
      </div>
      
      {campaigns.length > 0 ? (
        <DataTable 
          columns={campaignColumns} 
          data={campaigns}
          showPagination={true}
          searchPlaceholder="Buscar campanhas..."
          showColumnToggle={true}
        />
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>Nenhuma campanha encontrada no período especificado.</p>
        </div>
      )}
    </div>
  );
}