/**
 * Format date to simplified format: MM/DD HH:mm
 * Example: "10/17 18:30"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${month}/${day} ${hours}:${minutes}`;
}
