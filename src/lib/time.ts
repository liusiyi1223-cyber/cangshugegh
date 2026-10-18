export function formatRelativeTime(input: string | Date): string {
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return "";

  const diff = Math.max(0, Date.now() - t);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  if (diff < MIN) return "刚刚";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}分钟前`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}小时前`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}天前`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}周前`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}个月前`;
  return `${Math.floor(diff / YEAR)}年前`;
}
