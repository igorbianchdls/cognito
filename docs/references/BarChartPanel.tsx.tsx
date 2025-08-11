import React from 'react';
import { useStore } from '@nanostores/react';
import {
  chartContainerStore, updateChartContainer,
  chartAxesStore, updateChartAxes,
  chartLegendsStore, addChartLegend, updateChartLegend, removeChartLegend,
  chartGridStore, updateChartGrid,
  barChartStore, updateBarChartData, updateBarChartProperty
} from '../../../../../stores/chart-properties/BarChartStore';
import { 
  updateWidgetProps, 
  canvasLayoutStore, 
  updateCanvasLayoutProperty 
} from '../../../../../stores/dashboard/canvas-store';
import Accordion from '../../componentsSidebar/Accordion';
import Input from '../../componentsSidebar/Input';
import Slider from '../../componentsSidebar/Slider';
import ToggleButton from '../../componentsSidebar/ToggleButton';
import Dropdown from '../../componentsSidebar/Dropdown';

const BarChartPanel: React.FC<{ widget: any }> = ({ widget }) => {
  const chartContainer = useStore(chartContainerStore);
  const chartAxes = useStore(chartAxesStore);
  const chartLegends = useStore(chartLegendsStore);
  const chartGrid = useStore(chartGridStore);
  const barChart = useStore(barChartStore);
  const canvasLayout = useStore(canvasLayoutStore);

  const safeChart = widget?.chart || {};

  const handleLegendPropChange = (index: number, prop: string, value: any) => {
    const currentLegends = safeChart.legends || [];
    const newLegends = [...currentLegends];
    newLegends[index] = { ...newLegends[index], [prop]: value };
    updateWidgetProps(widget.id, { chart: { ...safeChart, legends: newLegends } });
  };

  const handleAddLegend = () => {
    const currentLegends = safeChart.legends || [];
    const newLegend = {
      dataFrom: 'keys',
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: 50,
      itemsSpacing: 2,
      itemWidth: 100,
      itemHeight: 20,
      itemDirection: 'left-to-right',
      itemOpacity: 0.85,
      symbolSize: 12,
    };
    updateWidgetProps(widget.id, { chart: { ...safeChart, legends: [...currentLegends, newLegend] } });
  };

  const handleRemoveLegend = (index: number) => {
    const currentLegends = safeChart.legends || [];
    const newLegends = currentLegends.filter((_, i) => i !== index);
    updateWidgetProps(widget.id, { chart: { ...safeChart, legends: newLegends } });
  };

  console.log('chartAxes.xAxisLabel:', chartAxes.xAxisLabel);

  function handleXAxisLabelChange(val: string) {
    console.log('Input X Axis Label mudou para:', val);
    updateWidgetProps(widget.id, { chart: { ...safeChart, xAxisLabel: val } });
  }
  function handleYAxisLabelChange(val: string) {
    console.log('Input Y Axis Label mudou para:', val);
    updateWidgetProps(widget.id, { chart: { ...safeChart, yAxisLabel: val } });
  }

  return (
    <div className="p-4 space-y-4" style={{ width: '100%', background: '#111111' }}>
      <h2 className="text-lg font-semibold mb-2">Propriedades do Gráfico de Barras</h2>
      {/* Accordion: Título e Subtítulo */}
      <Accordion title="Título e Subtítulo">
        <Input
          label="Título"
          value={safeChart.title || ''}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, title: val } })}
        />
        <Input label="Fonte do Título" value={chartContainer.titleFontFamily} onChange={val => updateChartContainer({ titleFontFamily: val })} />
        <Slider
          label="Tamanho da Fonte do Título"
          min={10}
          max={48}
          value={safeChart.titleFontSize ?? 18}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, titleFontSize: Number(val) } })}
        />
        <Slider
          label="Peso da Fonte do Título"
          min={100}
          max={900}
          step={100}
          value={safeChart.titleFontWeight ?? 700}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, titleFontWeight: Number(val) } })}
        />
        <Input
          label="Cor do Título"
          type="color"
          value={safeChart.titleColor || '#222'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, titleColor: val } })}
        />
        <Input
          label="Subtítulo"
          value={safeChart.subtitle || ''}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, subtitle: val } })}
        />
        <Input label="Fonte do Subtítulo" value={chartContainer.subtitleFontFamily} onChange={val => updateChartContainer({ subtitleFontFamily: val })} />
        <Slider
          label="Tamanho da Fonte do Subtítulo"
          min={8}
          max={32}
          value={safeChart.subtitleFontSize ?? 14}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, subtitleFontSize: Number(val) } })}
        />
        <Slider
          label="Peso da Fonte do Subtítulo"
          min={100}
          max={900}
          step={100}
          value={safeChart.subtitleFontWeight ?? 400}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, subtitleFontWeight: Number(val) } })}
        />
        <Input
          label="Cor do Subtítulo"
          type="color"
          value={safeChart.subtitleColor || '#6b7280'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, subtitleColor: val } })}
        />
        <Input
          label="Cor de Fundo"
          type="color"
          value={safeChart.backgroundColor || '#fff'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, backgroundColor: val } })}
        />
        <Input
          label="Cor da Borda"
          type="color"
          value={safeChart.borderColor || '#e5e7eb'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderColor: val } })}
        />
        <Slider
          label="Largura da Borda"
          min={0}
          max={10}
          value={safeChart.borderWidth ?? 1}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderWidth: Number(val) } })}
        />
        <Slider
          label="Raio da Borda"
          min={0}
          max={32}
          value={safeChart.borderRadius ?? 8}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderRadius: Number(val) } })}
        />
        <Input
          label="Sombra"
          value={safeChart.boxShadow || '0 1px 4px rgba(0,0,0,0.03)'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, boxShadow: val } })}
        />
        <Slider
          label="Padding"
          min={0}
          max={64}
          value={safeChart.padding ?? 24}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, padding: Number(val) } })}
        />
      </Accordion>
      {/* Accordion: Dimensions */}
      <Accordion title="Dimensions">
        <Input
          label="Largura (width)"
          type="number"
          value={safeChart.width || 600}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, width: Number(val) } })}
        />
        <Input
          label="Altura (height)"
          type="number"
          value={safeChart.height || 320}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, height: Number(val) } })}
        />
        <Input
          label="Margin Top"
          type="number"
          value={safeChart.margin?.top ?? 40}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, margin: { ...safeChart.margin, top: Number(val) } } })}
        />
        <Input
          label="Margin Right"
          type="number"
          value={safeChart.margin?.right ?? 40}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, margin: { ...safeChart.margin, right: Number(val) } } })}
        />
        <Input
          label="Margin Bottom"
          type="number"
          value={safeChart.margin?.bottom ?? 64}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, margin: { ...safeChart.margin, bottom: Number(val) } } })}
        />
        <Input
          label="Margin Left"
          type="number"
          value={safeChart.margin?.left ?? 64}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, margin: { ...safeChart.margin, left: Number(val) } } })}
        />
      </Accordion>
      
      {/* Accordion: Widget Layout */}
      <Accordion title="Widget Layout">
        <Slider
          label="Widget Height (Grid Rows)"
          min={1}
          max={8}
          step={1}
          value={widget.h ?? 3}
          onChange={val => updateWidgetProps(widget.id, { h: Number(val) })}
        />
        <Slider
          label="Widget Width (Grid Columns)"
          min={1}
          max={12}
          step={1}
          value={widget.w ?? 6}
          onChange={val => updateWidgetProps(widget.id, { w: Number(val) })}
        />
        <Slider
          label="Chart Min Height"
          min={100}
          max={600}
          step={20}
          value={safeChart.minHeight ?? 300}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, minHeight: Number(val) } })}
        />
      </Accordion>
      
      {/* Accordion: Axes */}
      <Accordion title="Axes">
        <Input
          label="X Axis Label"
          value={safeChart.xAxisLabel || ''}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, xAxisLabel: val } })}
        />
        <Slider
          label="X Tick Size"
          min={0}
          max={20}
          value={safeChart.xTickSize ?? 5}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, xTickSize: Number(val) } })}
        />
        <Slider
          label="X Tick Padding"
          min={0}
          max={20}
          value={safeChart.xTickPadding ?? 5}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, xTickPadding: Number(val) } })}
        />
        <Slider
          label="X Tick Rotation"
          min={-90}
          max={90}
          value={safeChart.xTickRotation ?? 0}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, xTickRotation: Number(val) } })}
        />
        <Slider
          label="Tamanho da fonte do label do tick X"
          min={0}
          max={40}
          step={1}
          value={safeChart.xTickLabelFontSize ?? 12}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, xTickLabelFontSize: Number(val) } })}
        />
        <Input
          label="Y Axis Label"
          value={safeChart.yAxisLabel || ''}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, yAxisLabel: val } })}
        />
        <Slider
          label="Y Tick Size"
          min={0}
          max={20}
          value={safeChart.yTickSize ?? 5}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, yTickSize: Number(val) } })}
        />
        <Slider
          label="Y Tick Padding"
          min={0}
          max={20}
          value={safeChart.yTickPadding ?? 5}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, yTickPadding: Number(val) } })}
        />
        <Slider
          label="Y Tick Rotation"
          min={-90}
          max={90}
          value={safeChart.yTickRotation ?? 0}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, yTickRotation: Number(val) } })}
        />
        <Slider
          label="Tamanho da fonte do label do tick Y"
          min={0}
          max={40}
          step={1}
          value={safeChart.yTickLabelFontSize ?? 12}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, yTickLabelFontSize: Number(val) } })}
        />
        <Slider
          label="Axis Label Font Size"
          min={8}
          max={40}
          value={safeChart.axisLabelFontSize ?? 14}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, axisLabelFontSize: Number(val) } })}
        />
      </Accordion>
      {/* Accordion: Grid */}
      <Accordion title="Grid">
        <ToggleButton
          label="Grid Vertical (enableGridX)"
          options={['Yes', 'No']}
          value={safeChart.enableGridX ? 'Yes' : 'No'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, enableGridX: val === 'Yes' } })}
        />
        <ToggleButton
          label="Grid Horizontal (enableGridY)"
          options={['Yes', 'No']}
          value={safeChart.enableGridY ? 'Yes' : 'No'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, enableGridY: val === 'Yes' } })}
        />
      </Accordion>
      {/* Accordion: Legends */}
      <Accordion title="Legends">
        {(safeChart.legends || []).map((legend, idx) => (
          <div key={idx} className="p-2 border rounded mb-2 space-y-2">
            <Dropdown
              label="Anchor"
              options={['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'center']}
              value={legend.anchor || 'bottom'}
              onChange={val => handleLegendPropChange(idx, 'anchor', val)}
            />
            <ToggleButton
              label="Direction"
              options={['column', 'row']}
              value={legend.direction || 'row'}
              onChange={val => handleLegendPropChange(idx, 'direction', val)}
            />
            <ToggleButton
              label="Justify"
              options={['Yes', 'No']}
              value={legend.justify ? 'Yes' : 'No'}
              onChange={val => handleLegendPropChange(idx, 'justify', val === 'Yes')}
            />
            <Slider
              label="Translate X"
              min={-200}
              max={200}
              value={legend.translateX ?? 0}
              onChange={val => handleLegendPropChange(idx, 'translateX', Number(val))}
            />
            <Slider
              label="Translate Y"
              min={-200}
              max={200}
              value={legend.translateY ?? 0}
              onChange={val => handleLegendPropChange(idx, 'translateY', Number(val))}
            />
            <Slider
              label="Item Width"
              min={0}
              max={200}
              value={legend.itemWidth ?? 100}
              onChange={val => handleLegendPropChange(idx, 'itemWidth', Number(val))}
            />
            <Slider
              label="Item Height"
              min={0}
              max={200}
              value={legend.itemHeight ?? 20}
              onChange={val => handleLegendPropChange(idx, 'itemHeight', Number(val))}
            />
            <Slider
              label="Items Spacing"
              min={0}
              max={60}
              value={legend.itemsSpacing ?? 2}
              onChange={val => handleLegendPropChange(idx, 'itemsSpacing', Number(val))}
            />
            <Dropdown
              label="Item Direction"
              options={['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top']}
              value={legend.itemDirection || 'left-to-right'}
              onChange={val => handleLegendPropChange(idx, 'itemDirection', val)}
            />
            <Slider
              label="Item Opacity"
              min={0}
              max={1}
              step={0.05}
              value={legend.itemOpacity ?? 0.85}
              onChange={val => handleLegendPropChange(idx, 'itemOpacity', Number(val))}
            />
            <Slider
              label="Symbol Size"
              min={2}
              max={60}
              value={legend.symbolSize ?? 12}
              onChange={val => handleLegendPropChange(idx, 'symbolSize', Number(val))}
            />
            <button onClick={() => handleRemoveLegend(idx)} className="text-xs text-red-500">
              Remover Legenda
            </button>
          </div>
        ))}
        <button onClick={handleAddLegend} className="text-xs text-blue-500 mt-2">
          Adicionar Legenda
        </button>
      </Accordion>
      {/* Accordion: Base */}
      <Accordion title="Base">
        <Input
          label="data"
          value={JSON.stringify(barChart.data)}
          onChange={val => {
            try {
              const arr = JSON.parse(String(val));
              if (Array.isArray(arr)) updateBarChartData(arr);
            } catch {}
          }}
          placeholder='[{"x": "A", "y": 10}, {"x": "B", "y": 20}]'
        />
        <div className="font-semibold text-xs text-gray-500 mt-4 mb-1">groupMode</div>
        <ToggleButton
          label="Agrupamento"
          options={['stacked', 'grouped']}
          value={barChart.groupMode}
          onChange={val => updateBarChartProperty('groupMode', val as 'stacked' | 'grouped')}
        />
        <div className="font-semibold text-xs text-gray-500 mt-4 mb-1">layout</div>
        <ToggleButton
          label="Layout"
          options={['vertical', 'horizontal']}
          value={barChart.layout}
          onChange={val => updateBarChartProperty('layout', val as 'vertical' | 'horizontal')}
        />
        <Slider
          label="Padding"
          min={0}
          max={0.9}
          step={0.01}
          value={barChart.padding}
          onChange={val => updateBarChartProperty('padding', Number(val))}
        />
        <Slider
          label="Inner Padding (px)"
          min={0}
          max={10}
          step={1}
          value={barChart.innerPadding}
          onChange={val => updateBarChartProperty('innerPadding', Number(val))}
        />
      </Accordion>
      {/* Accordion: Layout */}
      <Accordion title="Layout">
        <Dropdown
          label="Colors"
          options={['nivo', 'category10', 'accent', 'dark2', 'paired']}
          value={safeChart.colors || 'nivo'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, colors: val } })}
        />
        <Slider
          label="Border Radius"
          min={0}
          max={36}
          step={1}
          value={safeChart.borderRadius ?? 8}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderRadius: Number(val) } })}
        />
        <Slider
          label="Border Width"
          min={0}
          max={20}
          step={1}
          value={safeChart.borderWidth ?? 1}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderWidth: Number(val) } })}
        />
        <Dropdown
          label="Border Color"
          options={['inherit', 'theme', 'custom']}
          value={
            typeof safeChart.borderColor === 'string'
              ? safeChart.borderColor
              : safeChart.borderColor?.from === 'color'
                ? 'inherit'
                : 'custom'
          }
          onChange={val => {
            if (val === 'inherit') updateWidgetProps(widget.id, { chart: { ...safeChart, borderColor: { from: 'color' } } });
            else if (val === 'theme') updateWidgetProps(widget.id, { chart: { ...safeChart, borderColor: 'theme' } });
            else if (val === 'custom') updateWidgetProps(widget.id, { chart: { ...safeChart, borderColor: '#000000' } });
          }}
        />
        {typeof safeChart.borderColor === 'string' && safeChart.borderColor !== 'inherit' && safeChart.borderColor !== 'theme' && (
          <Input
            label="Custom Border Color"
            type="color"
            value={safeChart.borderColor}
            onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, borderColor: val } })}
          />
        )}
      </Accordion>
      {/* Accordion: Label */}
      <Accordion title="Label">
        <ToggleButton
          label="Enable Label"
          options={['Yes', 'No']}
          value={safeChart.enableLabel ? 'Yes' : 'No'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, enableLabel: val === 'Yes' } })}
        />
        <Dropdown
          label="Label Text Color"
          options={['inherit', 'theme', 'custom']}
          value={
            typeof safeChart.labelTextColor === 'string'
              ? safeChart.labelTextColor
              : safeChart.labelTextColor?.theme
                ? 'theme'
                : 'custom'
          }
          onChange={val => {
            if (val === 'inherit') updateWidgetProps(widget.id, { chart: { ...safeChart, labelTextColor: 'inherit' } });
            else if (val === 'theme') updateWidgetProps(widget.id, { chart: { ...safeChart, labelTextColor: { theme: 'labels.text.fill' } } });
            else if (val === 'custom') updateWidgetProps(widget.id, { chart: { ...safeChart, labelTextColor: '#000000' } });
          }}
        />
        {(typeof safeChart.labelTextColor === 'string' && safeChart.labelTextColor !== 'inherit' && safeChart.labelTextColor !== 'theme') && (
          <Input
            label="Custom Label Text Color"
            type="color"
            value={safeChart.labelTextColor}
            onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, labelTextColor: val } })}
          />
        )}
        <Slider
          label="Label Offset"
          min={-16}
          max={16}
          step={1}
          value={barChart.labelOffset}
          onChange={val => updateBarChartProperty('labelOffset', Number(val))}
        />
        <ToggleButton
          label="Enable Totals"
          options={['Yes', 'No']}
          value={barChart.enableTotals ? 'Yes' : 'No'}
          onChange={val => updateBarChartProperty('enableTotals', val === 'Yes')}
        />
        <Slider
          label="Totals Offset"
          min={0}
          max={40}
          step={1}
          value={barChart.totalsOffset}
          onChange={val => updateBarChartProperty('totalsOffset', Number(val))}
        />
        <Slider
          label="Label Skip Width"
          min={0}
          max={100}
          step={1}
          value={safeChart.labelSkipWidth ?? 0}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, labelSkipWidth: Number(val) } })}
        />
        <Slider
          label="Label Skip Height"
          min={0}
          max={100}
          step={1}
          value={safeChart.labelSkipHeight ?? 0}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, labelSkipHeight: Number(val) } })}
        />
        <Dropdown
          label="Label Position"
          options={['start', 'middle', 'end']}
          value={safeChart.labelPosition || 'middle'}
          onChange={val => updateWidgetProps(widget.id, { chart: { ...safeChart, labelPosition: val } })}
        />
      </Accordion>
    </div>
  );
};

export default BarChartPanel; 