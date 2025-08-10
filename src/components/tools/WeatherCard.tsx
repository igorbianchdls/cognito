interface WeatherData {
  location: string;
  temperature: number;
}

interface WeatherCardProps {
  data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
  const getTemperatureColor = (temp: number) => {
    if (temp >= 25) return 'text-red-500';
    if (temp >= 15) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getWeatherIcon = (temp: number) => {
    if (temp >= 25) return '☀️';
    if (temp >= 15) return '🌤️';
    if (temp >= 0) return '☁️';
    return '❄️';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {data.location}
        </h3>
        <span className="text-2xl" role="img" aria-label="weather">
          {getWeatherIcon(data.temperature)}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
          <span className={`font-bold text-lg ${getTemperatureColor(data.temperature)}`}>
            {data.temperature}°C
          </span>
        </div>
      </div>
    </div>
  );
}