'use client';

interface AlertsResultsProps {
  alertas: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    nivel: 'critico' | 'alto' | 'medio' | 'baixo';
    acao?: string;
  }>;
  resumo?: string;
  contexto?: string;
  totalAlertas: number;
  success?: boolean;
  error?: string;
}

function getNivelStyles(nivel: 'critico' | 'alto' | 'medio' | 'baixo') {
  switch (nivel) {
    case 'critico':
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-800'
      };
    case 'alto':
      return {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        icon: 'text-orange-500',
        badge: 'bg-orange-100 text-orange-800'
      };
    case 'medio':
      return {
        border: 'border-yellow-200',
        bg: 'bg-yellow-50',
        icon: 'text-yellow-500',
        badge: 'bg-yellow-100 text-yellow-800'
      };
    case 'baixo':
      return {
        border: 'border-green-200',
        bg: 'bg-green-50',
        icon: 'text-green-500',
        badge: 'bg-green-100 text-green-800'
      };
    default:
      return {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        icon: 'text-gray-500',
        badge: 'bg-gray-100 text-gray-800'
      };
  }
}

function getNivelIcon(nivel: 'critico' | 'alto' | 'medio' | 'baixo') {
  switch (nivel) {
    case 'critico':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'alto':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'medio':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'baixo':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AlertsResults({
  alertas,
  resumo,
  contexto,
  totalAlertas,
  success = true,
  error
}: AlertsResultsProps) {

  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao gerar alertas</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!alertas || alertas.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-green-800">Nenhum alerta encontrado</h3>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Não há alertas no momento. Tudo está funcionando normalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="font-semibold text-red-800">Alertas de Análise</h3>
          </div>
          <div className="text-sm text-red-600">
            {totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''}
          </div>
        </div>

        {contexto && (
          <p className="text-red-700 text-sm mb-2">{contexto}</p>
        )}
      </div>

      {/* Resumo Executivo */}
      {resumo && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <h4 className="font-semibold text-rose-800 mb-2">🚨 Resumo dos Alertas</h4>
          <p className="text-rose-700 text-sm">{resumo}</p>
        </div>
      )}

      {/* Grid de Alertas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alertas.map((alerta, index) => {
          const styles = getNivelStyles(alerta.nivel);
          const icon = getNivelIcon(alerta.nivel);

          return (
            <div
              key={index}
              className={`${styles.bg} ${styles.border} border rounded-lg p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${styles.icon} flex-shrink-0`}>
                  {icon}
                </div>
                <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full`}>
                  {alerta.nivel}
                </span>
              </div>

              <h5 className="font-semibold text-gray-900 mb-2">{alerta.titulo}</h5>

              <p className="text-gray-700 text-sm mb-3">{alerta.descricao}</p>

              {alerta.dados && (
                <div className="bg-white/50 rounded p-2 text-xs text-gray-600 font-mono mb-3">
                  📊 {alerta.dados}
                </div>
              )}

              {alerta.acao && (
                <div className="bg-white/70 rounded p-2 text-xs text-gray-700 border-l-4 border-indigo-400">
                  <div className="font-medium text-indigo-800">💡 Ação:</div>
                  {alerta.acao}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}