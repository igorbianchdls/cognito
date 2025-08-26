'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee, categoryColors } from '@/data/orgData';
import { Edit, MessageSquare, Database } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  level: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export default function EmployeeCard({ employee, level, isHighlighted = false, onClick }: EmployeeCardProps) {
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
      className={`min-w-[280px] max-w-[320px] cursor-pointer bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 rounded-2xl relative ${
        isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Badge no canto superior direito */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={`${getBadgeColor(employee.category)} text-white text-xs px-2 py-1 rounded-md`}>
            PRO
          </Badge>
        </div>

        {/* Retângulo cinza com 3 ícones */}
        <div className="bg-gray-100 rounded-t-2xl p-6 mb-6">
          <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-gray-600" />
            </div>
            <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center">
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${employee.iconColor} flex items-center justify-center text-white text-sm`}>
                {employee.icon}
              </div>
            </div>
            <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Conteúdo alinhado à esquerda */}
        <div className="px-6 pb-6">
          {/* Título alinhado à esquerda */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 leading-tight text-left">
              {employee.name}
            </h3>
          </div>

          {/* Descrição alinhada à esquerda */}
          <p className="text-sm text-gray-600 leading-relaxed text-left">
            {employee.description.length > 80 
              ? `${employee.description.substring(0, 80)}...`
              : employee.description
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}