/** Recharts dataKey expects its own TypedDataKey; our chart props use keyof T & string. */
export function chartDataKey<T extends object>(key: keyof T & string): string {
  return key
}
