'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee, categoryColors } from '@/data/orgData';
import { Edit, MessageSquare, Database } from 'lucide-react';
import MetaIcon from '@/components/icons/MetaIcon';
import AmazonIcon from '@/components/icons/AmazonIcon';
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon';
import GoogleAnalyticsIcon from '@/components/icons/GoogleAnalyticsIcon';
import ShopifyIcon from '@/components/icons/ShopifyIcon';
import ShopeeIcon from '@/components/icons/ShopeeIcon';
import ContaAzulIcon from '@/components/icons/ContaAzulIcon';

interface EmployeeCardProps {
  employee: Employee;
  level: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export default function EmployeeCard({ employee, level, isHighlighted = false, onClick }: EmployeeCardProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'meta-icon': MetaIcon,
    'amazon-icon': AmazonIcon,
    'google-ads-icon': GoogleAdsIcon,
    'google-analytics-icon': GoogleAnalyticsIcon,
    'shopify-icon': ShopifyIcon,
    'shopee-icon': ShopeeIcon,
    'conta-azul-icon': ContaAzulIcon,
  };

  const renderIcon = () => {
    if (employee.icon && iconMap[employee.icon]) {
      const IconComponent = iconMap[employee.icon];
      return <IconComponent className="w-7 h-7" />;
    }
    // Fallback para emojis
    return <span className="text-base">{employee.icon}</span>;
  };

  const getBadgeColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Executivo': 'bg-purple-500',
      'Vendas': 'bg-blue-500',
      'Operacional': 'bg-gray-500', 
      'Tráfego Pago': 'bg-green-500',
      'Marketing': 'bg-pink-500',
      'Comercial': 'bg-indigo-500',
      'Financeiro': 'bg-yellow-500',
      'Supply Chain': 'bg-cyan-500',
      'Contábil': 'bg-slate-500',
      'Jurídico': 'bg-gray-600',
      'Business Intelligence': 'bg-violet-500'
    };
    return colorMap[category] || 'bg-gray-500';
  };

  return (
    <Card 
      className={`min-w-[280px] max-w-[320px] cursor-pointer bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 rounded-2xl relative overflow-hidden py-0 ${
        isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      {/* Badge no canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className={`${getBadgeColor(employee.category)} text-white text-xs px-2 py-1 rounded-md`}>
          PRO
        </Badge>
      </div>

      {/* Retângulo cinza com 3 ícones - colado completamente no topo */}
      <div className="bg-gray-100 p-6">
        <div className="relative flex justify-center items-center gap-8">
          {/* Linha pontilhada conectora */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 border-t-2 border-dotted border-gray-400"></div>
          </div>
          
          {/* Esfera esquerda - menor */}
          <div className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center relative z-10">
            <Edit className="w-4 h-4 text-gray-600" />
          </div>
          
          {/* Esfera central - maior */}
          <div className="w-14 h-14 bg-white border border-gray-300 rounded-full flex items-center justify-center relative z-10">
            <div className={`w-7 h-7 rounded ${iconMap[employee.icon] ? 'bg-white' : `bg-gradient-to-br ${employee.iconColor}`} flex items-center justify-center text-white text-base`}>
              {renderIcon()}
            </div>
          </div>
          
          {/* Esfera direita - menor */}
          <div className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center relative z-10">
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Conteúdo alinhado à esquerda */}
      <div className="px-4 pt-2 pb-2 bg-white">
        {/* Título alinhado à esquerda - mais próximo do retângulo */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight text-left">
            {employee.name}
          </h3>
        </div>

        {/* Descrição alinhada à esquerda - mais próxima da borda inferior */}
        <p className="text-sm text-gray-600 leading-relaxed text-left">
          {employee.description.length > 80 
            ? `${employee.description.substring(0, 80)}...`
            : employee.description
          }
        </p>
      </div>
    </Card>
  );
}