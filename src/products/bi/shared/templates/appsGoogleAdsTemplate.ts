import { buildAdsDashboardTemplateText } from './appsAdsTemplateFactory'

export const APPS_GOOGLEADS_TEMPLATE_TEXT = buildAdsDashboardTemplateText({
  plataforma: 'google_ads',
  title: 'Dashboard Google Ads',
  subtitle: 'Lumi Skin • Search, Shopping e PMax (visão DTC)',
  palette: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#1A73E8'],
  topCampaignSecondaryTitle: 'Top Campanhas por Cliques',
  topCampaignSecondaryMeasure: 'SUM(cliques)',
  topCampaignSecondaryFormat: 'number',
  insights: [
    { icon: 'badgecheck', text: 'Compare ROAS, CTR e CVR em conjunto para separar ganho de tráfego de ganho de intenção/qualidade.' },
    { icon: 'trendingUp', text: 'Use filtros por conta/campanha para identificar concentração de gasto em Search, Shopping ou PMax.' },
    { icon: 'triangleAlert', text: 'Revise campanhas com alto gasto e ROAS baixo usando a faixa de gasto para priorizar o que realmente pesa no orçamento.' },
  ],
})
