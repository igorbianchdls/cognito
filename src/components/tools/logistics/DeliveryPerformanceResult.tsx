'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Truck } from 'lucide-react';

interface DeliveryPerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  transportadora_id?: string;
  total_envios?: number;
  envios_entregues?: number;
  on_time_delivery?: {
    rate: string;
    entregas_no_prazo: number;
    entregas_atrasadas: number;
    classificacao: string;
  };
  delivery_time?: {
    average_days: string;
    min_days: string;
    max_days: string;
    classificacao: string;
  };
  first_attempt_success?: {
    rate: string;
    classificacao: string;
  };
  lead_time?: {
    average_hours: string;
    classificacao: string;
  };
  sla_compliance?: {
    rate: string;
    status: string;
  };
  performance_geral?: {
    score: string;
    classificacao: string;
  };
}

export default function DeliveryPerformanceResult({
  success,
  message,
  periodo_dias,
  transportadora_id,
  total_envios,
  envios_entregues,
  on_time_delivery,
  delivery_time,
  first_attempt_success,
  lead_time,
  sla_compliance,
  performance_geral
}: DeliveryPerformanceResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Excelente') || classification.includes('Cumprindo')) {
      return 'text-green-600 bg-green-100 border-green-300';
    }
    if (classification.includes('Bom') || classification.includes('Rápido') || classification.includes('Normal')) {
      return 'text-blue-600 bg-blue-100 border-blue-300';
    }
    if (classification.includes('Atenção') || classification.includes('Lento')) {
      return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    }
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">🚚 Análise de Performance de Entregas</h3>
              <p className="text-sm text-blue-700 mt-1">
                {transportadora_id !== 'TODAS' ? `Transportadora: ${transportadora_id}` : 'Todas as transportadoras'} •
                Período: {periodo_dias} dias • {total_envios} envios
              </p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Geral */}
      {performance_geral && (
        <Card className={`border-2 ${getClassificationColor(performance_geral.classificacao)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Performance Geral</p>
              <p className="text-4xl font-bold mt-2">{performance_geral.score}</p>
              <p className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getClassificationColor(performance_geral.classificacao)}`}>
                {performance_geral.classificacao}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On-Time Delivery */}
        {on_time_delivery && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Entregas no Prazo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-700">{on_time_delivery.rate}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(on_time_delivery.classificacao)}`}>
                  {on_time_delivery.classificacao}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500">No prazo</p>
                    <p className="font-semibold text-green-600">{on_time_delivery.entregas_no_prazo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Atrasadas</p>
                    <p className="font-semibold text-red-600">{on_time_delivery.entregas_atrasadas}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Time */}
        {delivery_time && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Tempo de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">{delivery_time.average_days}</span>
                  <span className="text-sm text-gray-500">dias (média)</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(delivery_time.classificacao)}`}>
                  {delivery_time.classificacao}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Mínimo</p>
                    <p className="font-semibold">{delivery_time.min_days} dias</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Máximo</p>
                    <p className="font-semibold">{delivery_time.max_days} dias</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* First Attempt Success */}
        {first_attempt_success && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Sucesso 1ª Tentativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-700">{first_attempt_success.rate}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(first_attempt_success.classificacao)}`}>
                  {first_attempt_success.classificacao}
                </div>
                <p className="text-xs text-gray-600 pt-2 border-t">
                  Entregas bem-sucedidas na primeira tentativa
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Time */}
        {lead_time && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Lead Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-700">{lead_time.average_hours}</span>
                  <span className="text-sm text-gray-500">horas</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(lead_time.classificacao)}`}>
                  {lead_time.classificacao}
                </div>
                <p className="text-xs text-gray-600 pt-2 border-t">
                  Tempo do pedido até postagem
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SLA Compliance */}
      {sla_compliance && (
        <Card className={`border-2 ${getClassificationColor(sla_compliance.status)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SLA Compliance</p>
                <p className="text-2xl font-bold mt-1">{sla_compliance.rate}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getClassificationColor(sla_compliance.status)}`}>
                <p className="font-semibold">{sla_compliance.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-700 mb-3">📊 Resumo da Análise:</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Total de {total_envios} envios analisados no período de {periodo_dias} dias</p>
            <p>• {envios_entregues} entregas concluídas ({((envios_entregues || 0) / (total_envios || 1) * 100).toFixed(1)}%)</p>
            {on_time_delivery && parseFloat(on_time_delivery.rate) < 90 && (
              <p className="text-red-600 font-medium">⚠️ Taxa de entregas no prazo abaixo de 90% - ação necessária</p>
            )}
            {delivery_time && parseFloat(delivery_time.average_days) > 7 && (
              <p className="text-yellow-600 font-medium">⏰ Tempo médio de entrega acima de 7 dias - considerar otimizações</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
