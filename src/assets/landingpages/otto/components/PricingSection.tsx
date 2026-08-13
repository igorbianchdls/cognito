import {
  GrowthPricingSection,
  type GrowthPricingPlan,
} from '@/assets/landingpages/otto-fiscal/components/FiscalPricingSection'

const managementPlans: GrowthPricingPlan[] = [
  {
    name: 'Essencial',
    monthlyPrice: 69,
    annualPrice: 58,
    annualTotal: '690',
    monthlyVolume: '1 usuário',
    annualVolume: '1 usuário',
    additional: 'Para organizar os primeiros processos da empresa',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      'Clientes, fornecedores, produtos e serviços',
      'Vendas e compras',
      'Contas a pagar e a receber',
      'ChatGPT e Claude conectados à Otto',
      'Conciliação e classificação de despesas',
      'Suporte por e-mail',
    ],
  },
  {
    name: 'Gestão',
    monthlyPrice: 129,
    annualPrice: 108,
    annualTotal: '1.290',
    monthlyVolume: 'Até 3 usuários',
    annualVolume: 'Até 3 usuários',
    additional: 'Mais controle para a rotina financeira',
    featured: true,
    features: [
      'Taxa de adesão grátis',
      'Tudo do plano Essencial',
      'Contas financeiras e centros de custo',
      'Baixas parciais, totais e estornos',
      'Operações pelo ChatGPT ou Claude',
      'Cobranças e lembretes automáticos',
      'Relatórios financeiros completos',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Profissional',
    monthlyPrice: 199,
    annualPrice: 166,
    annualTotal: '1.990',
    monthlyVolume: 'Até 10 usuários',
    annualVolume: 'Até 10 usuários',
    additional: 'Para equipes e operações estruturadas',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      'Tudo do plano Gestão',
      'Histórico completo de alterações',
      'ChatGPT e Claude com permissões',
      'Compras e pagamentos recorrentes',
      'Dashboards e relatórios avançados',
      'Implantação guiada',
      'Atendimento prioritário',
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    annualTotal: null,
    monthlyVolume: 'Usuários sob medida',
    annualVolume: 'Usuários sob medida',
    additional: 'Plano personalizado para sua operação',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      'Tudo do plano Profissional',
      'Múltiplas empresas e equipes',
      'Permissões personalizadas',
      'Implantação acompanhada',
      'SLA e suporte dedicado',
      'Apoio técnico para integração',
    ],
  },
]

export function PricingSection() {
  return <GrowthPricingSection id="preco" plans={managementPlans} subtitle="Quanto mais sua empresa cresce, mais a Otto acompanha." />
}
