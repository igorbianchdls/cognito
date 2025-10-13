'use client';

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ToolUIPart } from 'ai';
import { CodeBlock } from './code-block';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border border-gray-200', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart['state']) => {
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <CircleIcon className="size-4" />,
    'input-available': <ClockIcon className="size-4 animate-pulse" />,
    'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
    'output-error': <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-4 p-3',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{(() => {
        const labels: Record<string, string> = {
          // Novos nomes (PT-BR)
          'tool-desempenhoPorConta': 'Desempenho por conta',
          'tool-desempenhoPorPlataforma': 'Desempenho por plataforma',
          'tool-desempenhoPorFormatoPost': 'Desempenho por formato de post',
          'tool-rankingPorPublicacao': 'Ranking por publicação',
          'tool-engajamentoPorDiaHora': 'Engajamento por dia da semana e horário',
          'tool-detectarAnomaliasPerformance': 'Detecção de anomalia (pico/queda de performance)',
          'tool-detectarQuedaSubitaAlcance': 'Anomalia por queda súbita de alcance',

          // Mapear ids antigos → rótulos novos (compat)
          'tool-analyzeContentPerformance': 'Desempenho por conta',
          'tool-comparePlatformPerformance': 'Desempenho por plataforma',
          'tool-analyzeContentMix': 'Desempenho por formato de post',
          'tool-identifyTopContent': 'Ranking por publicação',
          'tool-forecastEngagement': 'Engajamento por dia da semana e horário',
          'tool-calculateContentROI': 'Detecção de anomalia (pico/queda de performance)',
          'tool-analyzeAudienceGrowth': 'Anomalia por queda súbita de alcance',
          // Web Analytics (novos nomes)
          'tool-desempenhoGeralDoSite': 'Desempenho geral do site',
          'tool-desempenhoPorCanal': 'Desempenho por canal',
          'tool-etapasDoFunilGeral': 'Etapas do funil (geral)',
          'tool-desempenhoPorDiaHora': 'Desempenho por dia e hora',
          'tool-desempenhoMobileVsDesktop': 'Desempenho Mobile vs desktop',
          'tool-contribuicaoPorPagina': 'Contribuição por página',
          'tool-ltvMedio': 'LTV médio',
          'tool-deteccaoOutlierPorCanal': 'Detecção de outlier por canal',
          'tool-visitantesRecorrentes': 'Visitantes recorrentes',
          // Logistics (novos nomes)
          'tool-desempenhoEntregasGeral': 'Desempenho de entregas (geral)',
          'tool-eficienciaPorStatus': 'Eficiência por status',
          'tool-eficienciaOperacionalPorCD': 'Eficiência por CD',
          'tool-perfilPacotesPorTransportadora': 'Perfil de pacotes por transportadora',
          'tool-atrasosCriticosDeteccaoAnomalias': 'Atrasos críticos — detecção de anomalias',
          'tool-logisticaReversaDevolucoes': 'Logística reversa (devoluções)',
          'tool-rankingEficienciaPorCentro': 'Ranking de eficiência por centro',
          // Finance (novos nomes)
          'tool-situacaoOperacionalContas': 'Situação operacional — pagar x receber',
          'tool-alertaAumentoAnormalDespesas': 'Alerta de aumento de despesas',
          'tool-atrasosInadimplencia': 'Atrasos e inadimplência',
        };
        return labels[type] ?? type.replace('tool-', '');
      })()}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2',
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground',
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
};
