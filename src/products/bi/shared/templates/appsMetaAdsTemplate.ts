import { buildAdsDashboardTemplateText } from './appsAdsTemplateFactory'

export const APPS_METAADS_TEMPLATE_TEXT = buildAdsDashboardTemplateText({
  plataforma: 'meta_ads',
  title: 'Dashboard Meta Ads',
  subtitle: 'Lumi Skin • Performance DTC (campanhas, grupos e anúncios)',
  palette: ['#1877F2', '#00B2FF', '#34D399', '#F59E0B', '#EF4444'],
  topCampaignSecondaryTitle: 'Top Campanhas por Conversões',
  topCampaignSecondaryMeasure: 'SUM(conversoes)',
  topCampaignSecondaryFormat: 'number',
  insights: [
    { icon: 'trendingUp', text: 'Monitore ROAS e CPA juntos: crescimento de gasto com ROAS estável pode esconder piora de eficiência no funil.' },
    { icon: 'brain', text: 'Use filtros por campanha/grupo/anúncio para validar se a melhora vem de poucos criativos ou de ganho estrutural.' },
    { icon: 'triangleAlert', text: 'Aplique faixa de gasto para remover itens residuais e evitar rankings poluídos por campanhas com investimento mínimo.' },
  ],
})
