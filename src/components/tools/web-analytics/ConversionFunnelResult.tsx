'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Filter, AlertCircle } from 'lucide-react';

interface ConversionFunnelResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_steps?: number;
  conversion_rate?: string;
  steps?: Array<{
    step: number;
    event_name: string;
    usuarios: number;
    drop_off: string;
  }>;
  gargalos?: string[];
}

export default function ConversionFunnelResult({
  success,
  message,
  periodo_dias,
  total_steps,
  conversion_rate,
  steps,
  gargalos
}: ConversionFunnelResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">🎯 Funil de Conversão</h3>
              <p className="text-sm text-purple-700 mt-1">
                {total_steps} steps • Período: {periodo_dias} dias
              </p>
            </div>
            <Filter className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Taxa de Conversão Final</p>
            <p className="text-5xl font-bold text-green-700 mt-2">{conversion_rate}</p>
          </div>
        </CardContent>
      </Card>

      {/* Steps do Funil */}
      {steps && steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Steps do Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const dropOffValue = parseFloat(step.drop_off);
                const isGargalo = dropOffValue > 50;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${isGargalo ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isGargalo ? 'bg-red-600' : 'bg-purple-600'}`}>
                          {step.step}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{step.event_name}</p>
                          <p className="text-sm text-gray-600">{step.usuarios.toLocaleString()} usuários</p>
                        </div>
                      </div>

                      {idx > 0 && (
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${isGargalo ? 'text-red-700' : 'text-gray-700'}`}>
                            {step.drop_off}
                          </p>
                          <p className="text-xs text-gray-500">drop-off</p>
                        </div>
                      )}
                    </div>

                    {idx > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isGargalo ? 'bg-red-600' : 'bg-green-600'}`}
                            style={{ width: `${100 - dropOffValue}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gargalos */}
      {gargalos && gargalos.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              ⚠️ Gargalos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {gargalos.map((gargalo, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 font-bold">→</span>
                  <span className="flex-1 text-red-900 font-medium">{gargalo}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
