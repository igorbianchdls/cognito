'use client';

interface ChartData {
  label: string;
  value: number;
}

interface ChartGeneratorProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
}

export default function ChartGenerator({ title, data, type = 'bar' }: ChartGeneratorProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const BarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-2">
              <span className="text-xs font-medium text-white">
                {item.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const PieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const color = `hsl(${(index * 360) / data.length}, 70%, 50%)`;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="15.915"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)` }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LineChart = () => {
    const width = 300;
    const height = 150;
    const padding = 40;
    
    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.value / maxValue) * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center">
        <svg width={width} height={height} className="border rounded">
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="transition-all duration-1000"
          />
          {data.map((item, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((item.value / maxValue) * (height - 2 * padding));
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="transition-all duration-1000"
              />
            );
          })}
        </svg>
        <div className="flex justify-between w-full max-w-[300px] mt-2 text-xs text-gray-500">
          {data.map((item, index) => (
            <span key={index} className="truncate max-w-[60px]">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
        {title}
      </h3>
      
      <div className="mb-4">
        {type === 'bar' && <BarChart />}
        {type === 'pie' && <PieChart />}
        {type === 'line' && <LineChart />}
      </div>

      <div className="flex justify-center space-x-2 text-xs text-gray-500">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          Tipo: {type === 'bar' ? 'Barras' : type === 'pie' ? 'Pizza' : 'Linha'}
        </span>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          {data.length} itens
        </span>
      </div>
    </div>
  );
}