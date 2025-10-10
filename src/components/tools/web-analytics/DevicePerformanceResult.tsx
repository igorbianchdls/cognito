'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Smartphone, Monitor, Tablet } from 'lucide-react';

interface DevicePerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  devices?: Array<{
    device_type: string;
    sessoes: number;
    percentual: string;
    avg_duration: number;
    avg_pageviews: string;
  }>;
  top_browsers?: Array<{
    browser: string;
    sessoes: number;
    percentual: string;
  }>;
}

export default function DevicePerformanceResult({
  success,
  message,
  periodo_dias,
  devices,
  top_browsers
}: DevicePerformanceResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes('mobile') || type.includes('phone')) return <Smartphone className="h-8 w-8" />;
    if (type.includes('tablet')) return <Tablet className="h-8 w-8" />;
    return <Monitor className="h-8 w-8" />;
  };

  const getDeviceColor = (idx: number) => {
    const colors = [
      'border-blue-300 bg-blue-50',
      'border-green-300 bg-green-50',
      'border-purple-300 bg-purple-50',
      'border-gray-300 bg-gray-50'
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-cyan-200 bg-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-cyan-900">📱 Performance por Dispositivo</h3>
              <p className="text-sm text-cyan-700 mt-1">
                Período: {periodo_dias} dias
              </p>
            </div>
            <Smartphone className="h-8 w-8 text-cyan-600" />
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      {devices && devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, idx) => (
            <Card key={idx} className={`border-2 ${getDeviceColor(idx)}`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    {getDeviceIcon(device.device_type)}
                  </div>
                  <h4 className="font-semibold text-lg capitalize mb-2">{device.device_type}</h4>
                  <p className="text-3xl font-bold mb-1">{device.percentual}</p>
                  <p className="text-sm text-gray-600 mb-4">{device.sessoes.toLocaleString()} sessões</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-500">Duração Média</p>
                      <p className="font-semibold">{Math.round(device.avg_duration / 60)} min</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-500">Páginas/Sessão</p>
                      <p className="font-semibold">{device.avg_pageviews}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Top Browsers */}
      {top_browsers && top_browsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🌐 Top Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {top_browsers.map((browser, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">#{idx + 1}</span>
                    <span className="font-medium">{browser.browser}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{browser.percentual}</p>
                    <p className="text-xs text-gray-500">{browser.sessoes.toLocaleString()} sessões</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
