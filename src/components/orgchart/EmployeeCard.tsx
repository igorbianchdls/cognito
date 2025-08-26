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
        <div className="flex justify-center mb-3">
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

        {/* Capabilities or Subordinates */}
        {employee.capabilities && employee.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {employee.capabilities.slice(0, 2).map((capability, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                {capability}
              </Badge>
            ))}
            {employee.capabilities.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{employee.capabilities.length - 2} more
              </Badge>
            )}
          </div>
        )}
        
        {employee.subordinates && employee.subordinates.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {employee.subordinates.length} AI agent{employee.subordinates.length > 1 ? 's' : ''}
              </span>
              <div className="flex gap-1">
                {employee.subordinates.slice(0, 3).map((sub) => (
                  <div 
                    key={sub.id} 
                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${sub.iconColor} flex items-center justify-center text-white text-xs shadow-sm`}
                    title={sub.name}
                  >
                    {sub.icon}
                  </div>
                ))}
                {employee.subordinates.length > 3 && (
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                    +{employee.subordinates.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}