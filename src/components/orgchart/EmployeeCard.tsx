'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/data/orgData';

interface EmployeeCardProps {
  employee: Employee;
  level: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export default function EmployeeCard({ employee, level, isHighlighted = false, onClick }: EmployeeCardProps) {
  const getCardStyle = () => {
    if (level === 0) {
      return 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
    if (isHighlighted) {
      return 'border-2 border-orange-400 bg-orange-50 dark:bg-orange-900/20';
    }
    return 'border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200';
  };

  return (
    <Card 
      className={`min-w-[280px] max-w-[320px] cursor-pointer ${getCardStyle()}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            {employee.connectionScore && (
              <Badge 
                variant="secondary" 
                className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-4 min-w-[24px] bg-blue-100 text-blue-700 border-white border-2"
              >
                {employee.connectionScore}
              </Badge>
            )}
          </div>

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {employee.name}
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {employee.position}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-muted-foreground">
                {employee.location}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-7 0h2m-2 0H6m2 0h2M9 7h6m-6 4h6m-6 4h6" />
              </svg>
              <span className="text-xs text-muted-foreground">
                {employee.department}
              </span>
            </div>
          </div>
        </div>

        {/* Subordinates indicator */}
        {employee.subordinates && employee.subordinates.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {employee.subordinates.length} subordinado{employee.subordinates.length > 1 ? 's' : ''}
              </span>
              <div className="flex gap-1">
                {employee.subordinates.slice(0, 3).map((sub) => (
                  <div 
                    key={sub.id} 
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium"
                  >
                    {sub.name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
                {employee.subordinates.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
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