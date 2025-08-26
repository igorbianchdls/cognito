'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee, categoryColors } from '@/data/orgData';

interface EmployeeCardProps {
  employee: Employee;
  level: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export default function EmployeeCard({ employee, level, isHighlighted = false, onClick }: EmployeeCardProps) {
  const getCardStyle = () => {
    if (level === 0) {
      return 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20';
    }
    if (isHighlighted) {
      return 'border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-lg';
    }
    return 'border border-border hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800';
  };
  
  const categoryColorClass = employee.category ? categoryColors[employee.category] || categoryColors['All Teams'] : categoryColors['All Teams'];

  return (
    <Card 
      className={`min-w-[280px] max-w-[320px] cursor-pointer ${getCardStyle()} relative`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Icon */}
        <div className="flex justify-start mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${employee.iconColor} flex items-center justify-center text-white text-lg shadow-sm`}>
            {employee.icon}
          </div>
        </div>

        {/* Title */}
        <div className="text-left mb-3">
          <h3 className="font-semibold text-base text-foreground leading-tight">
            {employee.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {employee.description}
        </p>

      </CardContent>
    </Card>
  );
}