'use client';

import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { Button } from '@/components/ui/button';
import { visualBuilderActions } from '@/stores/visualBuilderStore';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wrench, Rocket } from 'lucide-react';
import { useState } from 'react';

type Operation =
  | { type: 'update-widget-attrs'; widgetId: string; attrs: Record<string, string | number | boolean> }
  | { type: 'update-widget-config'; widgetId: string; configText: string }
  | { type: 'remove-widget'; widgetId: string }
  | { type: 'insert-widget-after'; targetWidgetId: string; widgetHtml: string };

interface PatchDashboardToolCardProps {
  success: boolean;
  previewDsl?: string;
  operations?: Operation[];
  message?: string;
  error?: string;
}

export default function PatchDashboardToolCard({ success, previewDsl = '', operations = [], message, error }: PatchDashboardToolCardProps) {
  const [code, setCode] = useState(previewDsl);
  const [applied, setApplied] = useState(false);

  const apply = () => {
    visualBuilderActions.updateCode(code);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-700 font-medium">Falha ao aplicar patch</div>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-700" />
          <span className="font-medium text-gray-900">Patch de Dashboard (Preview)</span>
          <Badge variant="secondary">{operations.length} operação{operations.length !== 1 ? 'es' : ''}</Badge>
        </div>
      </div>

      {message && (
        <div className="p-3 text-sm text-gray-700 border-b bg-gray-50">{message}</div>
      )}

      {operations.length > 0 && (
        <div className="p-3 text-xs text-gray-700 border-b">
          <div className="font-medium mb-1">Operações</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {operations.map((op, i) => (
              <li key={i}>{op.type} — {('widgetId' in op ? op.widgetId : ('targetWidgetId' in op ? op.targetWidgetId : ''))}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="h-96">
        <MonacoEditor value={code} onChange={setCode} language="html" height="100%" />
      </div>

      <div className="border-t bg-gray-50 p-3 flex items-center justify-end">
        <Button onClick={apply} className={applied ? 'bg-green-600 hover:bg-green-600' : ''}>
          {applied ? (<><CheckCircle className="w-4 h-4 mr-1" /> Aplicado</>) : (<><Rocket className="w-4 h-4 mr-1" /> Aplicar ao Editor</>)}
        </Button>
      </div>
    </div>
  );
}

