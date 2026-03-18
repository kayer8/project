import { ROUTES } from '../constants/routes';
import { buildQuery } from './format';

const TAB_ROUTES = new Set<string>([
  ROUTES.home,
  ROUTES.vote.list,
  ROUTES.publicity.index,
  ROUTES.profile.index,
]);

function isTabRoute(url: string) {
  const [path] = url.split('?');
  return TAB_ROUTES.has(path);
}

export function navigateTo(url: string, params?: Record<string, string | number | undefined>) {
  wx.navigateTo({
    url: `${url}${buildQuery(params || {})}`,
  });
}

export function redirectTo(url: string, params?: Record<string, string | number | undefined>) {
  wx.redirectTo({
    url: `${url}${buildQuery(params || {})}`,
  });
}

export function switchTab(url: string) {
  wx.switchTab({ url });
}

export function openRoute(url: string, params?: Record<string, string | number | undefined>) {
  const target = `${url}${buildQuery(params || {})}`;
  const [path] = target.split('?');
  if (isTabRoute(target)) {
    wx.switchTab({ url: path });
    return;
  }
  wx.navigateTo({ url: target });
}
