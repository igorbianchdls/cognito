// Exemplo de uso do ChartEditor - apenas para validação de tipos
// Este arquivo pode ser removido após confirmação

import ChartEditor from './ChartEditor'
import type { BaseWidget } from '@/types/apps/baseWidget'
import type { BaseChartConfig } from '@/types/apps/chartWidgets'
import type { ContainerConfig } from '@/types/apps/widget'

// Exemplo de widget que satisfaz BaseWidget
const exampleWidget: BaseWidget = {
  id: 'chart-1',
  i: 'chart-1',
  name: 'Sample Chart',
  type: 'bar-chart',
  icon: '📊',
  description: 'Sample chart widget',
  x: 0,
  y: 0,
  w: 6,
  h: 4,
  defaultWidth: 6,
  defaultHeight: 4
}

const exampleChartConfig: BaseChartConfig = {
  title: 'Sample Chart',
  backgroundColor: '#ffffff'
}

const exampleContainerConfig: ContainerConfig = {
  backgroundColor: '#ffffff'
}

// Exemplo de uso - mostra que a interface está correta
const ExampleUsage = () => {
  return (
    <ChartEditor
      selectedWidget={exampleWidget}
      chartConfig={exampleChartConfig}
      containerConfig={exampleContainerConfig}
      onChartConfigChange={(field, value) => console.log('Chart config:', field, value)}
      onContainerConfigChange={(field, value) => console.log('Container config:', field, value)}
      onWidgetPositionChange={(field, value) => console.log('Position change:', field, value)}
    />
  )
}

export default ExampleUsage