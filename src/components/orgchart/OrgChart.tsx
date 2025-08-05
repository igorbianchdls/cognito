'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmployeeCard from './EmployeeCard';
import { Employee, orgData, additionalEmployees } from '@/data/orgData';
import Sidebar from '../navigation/Sidebar';

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

    return (
      <div key={employee.id} className="flex flex-col items-center relative">
        {/* Connector Line */}
        {level > 0 && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div className="w-px h-8 bg-border"></div>
          </div>
        )}

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
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 p-0 rounded-full bg-background border-2"
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

        {/* Subordinates */}
        {hasSubordinates && isExpanded && (
          <div className="mt-12 relative">
            {/* Horizontal connector line */}
            {employee.subordinates!.length > 1 && (
              <div className="absolute -top-6 left-0 right-0 h-px bg-border"></div>
            )}
            
            <div className="flex gap-8 justify-center flex-wrap">
              {employee.subordinates!.map((subordinate) => (
                <div key={subordinate.id} className="relative">
                  {/* Vertical connector to horizontal line */}
                  {employee.subordinates!.length > 1 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-border"></div>
                  )}
                  {renderEmployee(subordinate, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Org Chart Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-8">
          <div className="min-w-max">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Organograma</h1>
              <p className="text-muted-foreground">
                Estrutura organizacional da empresa • Clique nos cards para ver detalhes
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

            {/* Additional Employees Section */}
            <div className="mt-16 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Outros Funcionários
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {additionalEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    level={3}
                    isHighlighted={selectedEmployee?.id === employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                  />
                ))}
              </div>
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
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedEmployee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.position}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Departamento
                  </label>
                  <p className="text-sm">{selectedEmployee.department}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Localização
                  </label>
                  <p className="text-sm">{selectedEmployee.location}</p>
                </div>
                {selectedEmployee.connectionScore && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pontuação de Conexão
                    </label>
                    <p className="text-sm">{selectedEmployee.connectionScore}</p>
                  </div>
                )}
                {selectedEmployee.subordinates && selectedEmployee.subordinates.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Subordinados Diretos
                    </label>
                    <p className="text-sm">{selectedEmployee.subordinates.length}</p>
                    <div className="mt-2 space-y-1">
                      {selectedEmployee.subordinates.map(sub => (
                        <div key={sub.id} className="text-xs text-muted-foreground">
                          • {sub.name} - {sub.position}
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
    </div>
  );
}