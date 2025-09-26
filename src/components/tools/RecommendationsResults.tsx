'use client';

interface RecommendationsResultsProps {
  recomendacoes: Array<{
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    facilidade: 'facil' | 'medio' | 'dificil';
    categoria?: string;
    proximosPassos?: string[];
    estimativaResultado?: string;
  }>;
  resumo?: string;
  contexto?: string;
  totalRecomendacoes: number;
  success?: boolean;
  error?: string;
}

function getPriorityStyles(impacto: 'alto' | 'medio' | 'baixo', facilidade: 'facil' | 'medio' | 'dificil') {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 };
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
  const priority = (impactoScore[impacto] * 2) + facilidadeScore[facilidade];

  if (priority >= 7) {
    return {
      border: 'border-green-300',
      bg: 'bg-green-100',
      icon: 'text-green-600',
      badge: 'bg-green-200 text-green-900'
    };
  } else if (priority >= 5) {
    return {
      border: 'border-teal-200',
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-800'
    };
  } else {
    return {
      border: 'border-lime-200',
      bg: 'bg-lime-50',
      icon: 'text-lime-600',
      badge: 'bg-lime-100 text-lime-800'
    };
  }
}

function getPriorityIcon(impacto: 'alto' | 'medio' | 'baixo', facilidade: 'facil' | 'medio' | 'dificil') {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 };
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
  const priority = (impactoScore[impacto] * 2) + facilidadeScore[facilidade];

  if (priority >= 7) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );
  } else if (priority >= 5) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  } else {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
}

export default function RecommendationsResults({
  recomendacoes,
  resumo,
  contexto,
  totalRecomendacoes,
  success = true,
  error
}: RecommendationsResultsProps) {

  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao gerar recomendações</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!recomendacoes || recomendacoes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-blue-800">Nenhuma recomendação encontrada</h3>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Não foram geradas recomendações para análise.
        </p>
      </div>
    );
  }

  // Ordenar recomendações por prioridade
  const recomendacoesOrdenadas = [...recomendacoes].sort((a, b) => {
    const impactoScore = { alto: 3, medio: 2, baixo: 1 };
    const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
    const priorityA = (impactoScore[a.impacto] * 2) + facilidadeScore[a.facilidade];
    const priorityB = (impactoScore[b.impacto] * 2) + facilidadeScore[b.facilidade];
    return priorityB - priorityA;
  });

  return (
    <div className="space-y-4 mb-4">
      {/* Header */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="font-semibold text-gray-900">📋 Recomendações de Análise</h3>
          </div>
          <div className="text-sm text-gray-700">
            {totalRecomendacoes} recomendaç{totalRecomendacoes !== 1 ? 'ões' : 'ão'}
          </div>
        </div>

        {contexto && (
          <p className="text-gray-800 text-sm mb-2">{contexto}</p>
        )}
      </div>

      {/* Resumo Executivo */}
      {resumo && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">💡 Resumo das Recomendações</h4>
          <p className="text-gray-800 text-sm">{resumo}</p>
        </div>
      )}

      {/* Grid de Recomendações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recomendacoesOrdenadas.map((recomendacao, index) => {
          const styles = getPriorityStyles(recomendacao.impacto, recomendacao.facilidade);
          const icon = getPriorityIcon(recomendacao.impacto, recomendacao.facilidade);
          const impactoScore = { alto: 3, medio: 2, baixo: 1 };
          const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
          const priority = (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade];

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
                  P{priority}
                </span>
              </div>

              <h5 className="font-semibold text-gray-900 mb-2">{recomendacao.titulo}</h5>

              <p className="text-gray-700 text-sm mb-3">{recomendacao.descricao}</p>

              {recomendacao.categoria && (
                <div className="mb-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                    {recomendacao.categoria}
                  </span>
                </div>
              )}

              {recomendacao.estimativaResultado && (
                <div className="bg-green-50 rounded p-2 text-xs text-green-700 mb-3 border border-green-200">
                  <div className="font-medium text-green-800">🎯 Resultado esperado:</div>
                  {recomendacao.estimativaResultado}
                </div>
              )}

              {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 border border-blue-200">
                  <div className="font-medium text-blue-800 mb-1">📝 Próximos passos:</div>
                  <ul className="space-y-1">
                    {recomendacao.proximosPassos.map((passo, passoIndex) => (
                      <li key={passoIndex} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{passo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center mt-3 text-xs">
                <div className="flex gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {recomendacao.impacto} impacto
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {recomendacao.facilidade}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}