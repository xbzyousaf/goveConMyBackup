type MonthlyMetricOptions<T> = {
  dateKey: keyof T;
  valueFn: (item: T) => number;
};

export function calculateMonthlyMetric<T>(
  items: T[],
  { dateKey, valueFn }: MonthlyMetricOptions<T>
) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const currentValue = items
    .filter(i => {
      const d = new Date(String(i[dateKey]));
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, i) => sum + valueFn(i), 0);

  const lastValue = items
    .filter(i => {
      const d = new Date(String(i[dateKey]));
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((sum, i) => sum + valueFn(i), 0);

  if (lastValue === 0 && currentValue > 0) {
    return { percentChange: 100, label: "new this month" };
  }

  if (lastValue === 0) {
    return { percentChange: 0, label: "no change" };
  }

  return {
    percentChange: Math.round(((currentValue - lastValue) / lastValue) * 100),
    label: "from last month",
  };
}
