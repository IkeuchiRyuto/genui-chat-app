import { Card, CardBody, Chip } from "@heroui/react";
import { CloudIcon, SunIcon } from "@heroicons/react/24/solid";

type WeatherProps = {
  temperature: number;
  weather: string;
  location: string;
};

const getWeatherIcon = (weather: string) => {
  if (!weather) return <SunIcon className="w-8 h-8 text-gray-400" />;
  switch (weather.toLowerCase()) {
    case "sunny":
      return <SunIcon className="w-8 h-8 text-yellow-500" />;
    case "cloudy":
      return <CloudIcon className="w-8 h-8 text-gray-500" />;
    case "rainy":
      return <CloudIcon className="w-8 h-8 text-blue-500" />;
    case "snowy":
      return <CloudIcon className="w-8 h-8 text-blue-200" />;
    default:
      return <SunIcon className="w-8 h-8 text-gray-400" />;
  }
};

const getWeatherColor = (weather: string) => {
  if (!weather) return "default";
  switch (weather.toLowerCase()) {
    case "sunny":
      return "warning";
    case "cloudy":
      return "default";
    case "rainy":
      return "primary";
    case "snowy":
      return "secondary";
    default:
      return "default";
  }
};

export const Weather = ({ temperature, weather, location }: WeatherProps) => {
  return (
    <Card className="max-w-sm bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{location}</h3>
            <p className="text-sm text-default-500">現在の天気</p>
          </div>
          {getWeatherIcon(weather)}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-foreground">
            {temperature}°C
          </div>
          <Chip
            color={getWeatherColor(weather) as any}
            variant="flat"
            size="md"
          >
            {weather}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
};
