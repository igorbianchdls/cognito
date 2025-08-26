'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmployeeCard from './EmployeeCard';
import { Employee, orgData, additionalEmployees } from '@/data/orgData';

export default function OrgChart() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1']));

  const toggleExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };


  const renderEmployee = (employee: Employee, level: number = 0): React.ReactNode => {
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
    const isExpanded = expandedNodes.has(employee.id);
    const subordinatesCount = employee.subordinates?.length || 0;

    return (
      <div key={employee.id} className="flex flex-col items-center relative">
        {/* Employee Card */}
        <div className="relative z-10">
          <EmployeeCard
            employee={employee}
            level={level}
            isHighlighted={selectedEmployee?.id === employee.id}
            onClick={() => setSelectedEmployee(employee)}
          />
          
          {/* Expand/Collapse Button */}
          {hasSubordinates && (
            <Button
              variant="outline"
              size="sm"
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 p-0 rounded-full bg-background border-2 z-20"
              onClick={() => toggleExpanded(employee.id)}
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          )}
        </div>

        {/* Connection lines and subordinates */}
        {hasSubordinates && isExpanded && (
          <div className="relative mt-6">
            {/* Vertical line from expand button to horizontal line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-border z-0"></div>
            
            {subordinatesCount === 1 ? (
              /* Single subordinate - direct vertical line */
              <div className="pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-border z-0"></div>
                <div className="pt-6">
                  {renderEmployee(employee.subordinates![0], level + 1)}
                </div>
              </div>
            ) : (
              /* Multiple subordinates - horizontal distribution */
              <div className="pt-6 relative">
                {/* Horizontal connector line */}
                <div className="absolute top-6 left-0 right-0 h-px bg-border z-0"></div>
                
                <div className="flex gap-12 justify-center items-start pt-6">
                  {employee.subordinates!.map((subordinate) => (
                    <div key={subordinate.id} className="relative">
                      {/* Vertical line from horizontal line to subordinate */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-border z-0"></div>
                      {renderEmployee(subordinate, level + 1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Org Chart Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-8">
          <div className="min-w-max">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Agents Network</h1>
              <p className="text-muted-foreground">
                Estrutura dos agentes de IA • Clique nos cards para ver detalhes
              </p>
            </div>

            {/* Controls */}
            <div className="mb-6 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodes(new Set(['1']))}
              >
                Recolher Tudo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allIds = new Set<string>();
                  const collectIds = (emp: Employee) => {
                    allIds.add(emp.id);
                    emp.subordinates?.forEach(collectIds);
                  };
                  collectIds(orgData);
                  setExpandedNodes(allIds);
                }}
              >
                Expandir Tudo
              </Button>
              <Badge variant="secondary" className="ml-auto">
                {expandedNodes.size} nós expandidos
              </Badge>
            </div>

            {/* Org Chart */}
            <div className="flex justify-center">
              {renderEmployee(orgData)}
            </div>

          </div>
        </div>

        {/* Side Panel for Employee Details */}
        {selectedEmployee && (
          <div className="w-80 border-l border-border bg-muted/30 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedEmployee.iconColor} flex items-center justify-center text-white font-semibold text-lg`}>
                    {selectedEmployee.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedEmployee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Categoria
                  </label>
                  <p className="text-sm">{selectedEmployee.category}</p>
                </div>
                {selectedEmployee.capabilities && selectedEmployee.capabilities.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Capacidades
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmployee.capabilities.map((capability, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEmployee.subordinates && selectedEmployee.subordinates.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agentes Gerenciados
                    </label>
                    <p className="text-sm">{selectedEmployee.subordinates.length}</p>
                    <div className="mt-2 space-y-1">
                      {selectedEmployee.subordinates.map(sub => (
                        <div key={sub.id} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className={`w-4 h-4 rounded bg-gradient-to-br ${sub.iconColor} flex items-center justify-center text-white text-xs`}>
                            {sub.icon}
                          </span>
                          {sub.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}