'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface TopLandingPagesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_paginas?: number;
  top_pages?: Array<{
    pagina: string;
    pageviews: number;
  }>;
  worst_pages?: Array<{
    pagina: string;
    pageviews: number;
  }>;
}

export default function TopLandingPagesResult({
  success,
  message,
  periodo_dias,
  total_paginas,
  top_pages,
  worst_pages
}: TopLandingPagesResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Landing Pages
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
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-green-900">📄 Landing Pages</h3>
              <p className="text-sm text-green-700 mt-1">
                {total_paginas} páginas analisadas • Período: {periodo_dias} dias
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      {top_pages && top_pages.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              🏆 Top Landing Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {top_pages.map((page, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${idx < 3 ? 'border-green-300 bg-green-50' : 'border-gray-200'} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-2xl ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                      </span>
                      <p className="text-sm font-medium truncate flex-1" title={page.pagina}>
                        {page.pagina}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-green-700">{page.pageviews.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">pageviews</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worst Pages */}
      {worst_pages && worst_pages.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              ⚠️ Páginas com Menor Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {worst_pages.map((page, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-yellow-200 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" title={page.pagina}>
                        {page.pagina}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-yellow-700">{page.pageviews.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">pageviews</p>
                    </div>
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
