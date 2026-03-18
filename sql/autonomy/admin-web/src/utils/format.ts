function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseDate(value?: string | number | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string | number | Date | null, fallback = '-') {
  const date = parseDate(value);
  if (!date) {
    return fallback;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatDate(value?: string | number | Date | null, fallback = '-') {
  const date = parseDate(value);
  if (!date) {
    return fallback;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateInputValue(value?: string | number | Date | null) {
  const date = parseDate(value);
  if (!date) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatText(value?: string | number | null, fallback = '-') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return String(value);
}

export function formatArea(value?: number | null, fallback = '-') {
  if (value === undefined || value === null) {
    return fallback;
  }

  return `${value} ㎡`;
}
