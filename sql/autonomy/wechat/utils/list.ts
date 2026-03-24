export interface LocalListPageResult<T> {
  items: T[];
  total: number;
  finished: boolean;
}

export function getLocalListPage<T>(source: T[], offset: number, pageSize: number): LocalListPageResult<T> {
  const items = source.slice(offset, offset + pageSize);
  return {
    items,
    total: source.length,
    finished: offset + items.length >= source.length,
  };
}

export function getLocalListFirstPage<T>(source: T[], pageSize: number): LocalListPageResult<T> {
  return getLocalListPage(source, 0, pageSize);
}
