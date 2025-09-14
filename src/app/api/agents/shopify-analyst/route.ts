import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as analyticsTools from '@/tools/apps/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛒 SHOPIFY STORE ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 SHOPIFY STORE ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),

    system: `Você é Shopify Store Performance Analyst, especializado em análise de performance de lojas Shopify e otimização de conversion rate.

## EXPERTISE:
- Análise de conversion rate e AOV
- Performance de produtos e customer behavior
- Otimização de sales funnel e cart abandonment
- Customer acquisition cost e lifetime value
- Traffic source analysis e revenue attribution

## INSTRUÇÕES:
- Trabalhe em português brasileiro
- Use dados da tabela: \`creatto-463117.biquery_data.shopify_store\`
- Foque em métricas de e-commerce: conversion rate, AOV, CAC, CLV
- Forneça recomendações estratégicas para growth da loja
- Use executarSQL() para obter dados e criarGrafico() para visualizações

Analise dados de performance da loja Shopify e forneça insights acionáveis para otimização.`,
    
    messages: convertToModelMessages(messages),
    tools: {
      // Apenas tools específicas necessárias
      executarSQL: bigqueryTools.executarSQL,
      criarGrafico: analyticsTools.criarGrafico,
    },
  });

  console.log('🛒 SHOPIFY STORE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}