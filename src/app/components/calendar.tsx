import { Card, CardBody, Chip } from "@heroui/react";
import { CalendarIcon, ClockIcon } from "@heroicons/react/24/solid";

type CalendarEventProps = {
  title: string;
  date: string;
  time: string;
  description?: string;
};

export const CalendarEvent = ({
  title,
  date,
  time,
  description,
}: CalendarEventProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  return (
    <Card className="max-w-sm bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900">
      <CardBody className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-6 h-6 text-orange-500" />
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-default-500">カレンダーイベント</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-default-400" />
            <span className="text-sm text-foreground">{formatDate(date)}</span>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-default-400" />
            <Chip color="primary" variant="flat" size="sm">
              {time}
            </Chip>
          </div>

          {description && (
            <div className="mt-4 p-3 bg-default-100 dark:bg-default-50 rounded-lg">
              <p className="text-sm text-default-700">{description}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
