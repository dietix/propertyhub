export function parseDateOnly(value: string | Date): Date {
  if (!value) throw new Error("Invalid date value");

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const [datePart] = value.split("T");
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    const fallback = new Date(value);
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  return new Date(year, month - 1, day);
}

export function formatDateOnly(value: string | Date): string {
  const date = parseDateOnly(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
