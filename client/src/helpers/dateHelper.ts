const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const isCurrentMonth = (date: string) => {
  const d = new Date(date);
  return (
    d.getMonth() === currentMonth &&
    d.getFullYear() === currentYear
  );
};
export { isCurrentMonth };