function buildQuery(params: Record<string, string | number | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
}

export function navigateTo(url: string, params?: Record<string, string | number | undefined>) {
  wx.navigateTo({ url: `${url}${buildQuery(params || {})}` });
}

export function redirectTo(url: string, params?: Record<string, string | number | undefined>) {
  wx.redirectTo({ url: `${url}${buildQuery(params || {})}` });
}

export function reLaunch(url: string, params?: Record<string, string | number | undefined>) {
  wx.reLaunch({ url: `${url}${buildQuery(params || {})}` });
}
