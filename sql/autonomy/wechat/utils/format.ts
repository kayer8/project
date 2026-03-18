export function formatKeyValue(items: Array<{ label: string; value: string }>) {
  return items;
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .map((key) => `${key}=${encodeURIComponent(String(params[key]))}`)
    .join('&');

  return query ? `?${query}` : '';
}
