'use client';

interface EmptyStateProps {
  message?: string;
  subtitle?: string;
}

export function EmptyState({ 
  message = "Sem dados para exibir", 
  subtitle = "Verifique se os dados foram carregados corretamente" 
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">{message}</div>
        <div className="text-sm">{subtitle}</div>
      </div>
    </div>
  );
}