'use client';

interface WeatherCardProps {
  location: string;
  temperature: number;
}

export default function WeatherCard({ location, temperature }: WeatherCardProps) {
  const getWeatherIcon = (temp: number) => {
    if (temp >= 80) return '☀️';
    if (temp >= 60) return '⛅';
    if (temp >= 40) return '🌤️';
    return '❄️';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 80) return 'text-orange-600';
    if (temp >= 60) return 'text-yellow-600';
    if (temp >= 40) return 'text-blue-600';
    return 'text-blue-800';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 max-w-sm mx-auto border border-blue-200/50 dark:border-blue-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Clima Atual
        </h3>
        <span className="text-3xl">{getWeatherIcon(temperature)}</span>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {location}
        </div>
        <div className={`text-4xl font-bold ${getTemperatureColor(temperature)} mb-2`}>
          {temperature}°F
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {temperature >= 80 ? 'Muito quente' : 
           temperature >= 60 ? 'Agradável' :
           temperature >= 40 ? 'Fresco' : 'Frio'}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-700/50">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Atualizado agora</span>
          <span>🌡️ Preciso</span>
        </div>
      </div>
    </div>
  );
}