import { Card, CardBody, Progress } from "@heroui/react";
import { ChartBarIcon } from "@heroicons/react/24/solid";

type ChartProps = {
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
  type: "bar" | "line" | "pie";
};

export const Chart = ({ title, data, type }: ChartProps) => {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <Card className="max-w-md bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900">
      <CardBody className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon className="w-6 h-6 text-purple-500" />
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-default-500">
              {type.toUpperCase()}チャート
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-sm text-default-500">{item.value}</span>
              </div>
              <Progress
                value={(item.value / maxValue) * 100}
                color="secondary"
                size="sm"
                className="w-full"
              />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
