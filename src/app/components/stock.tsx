import { Card, CardBody, Chip } from "@heroui/react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/solid";

type StockProps = {
  price: number;
  symbol: string;
  change: number;
  changePercent: number;
};

export const Stock = ({ price, symbol, change, changePercent }: StockProps) => {
  const isPositive = change >= 0;

  return (
    <Card className="max-w-sm bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{symbol}</h3>
            <p className="text-sm text-default-500">株価情報</p>
          </div>
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
          ) : (
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground">
            ${price.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Chip
              color={isPositive ? "success" : "danger"}
              variant="flat"
              size="sm"
            >
              {isPositive ? "+" : ""}
              {change.toFixed(2)}
            </Chip>
            <Chip
              color={isPositive ? "success" : "danger"}
              variant="flat"
              size="sm"
            >
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
