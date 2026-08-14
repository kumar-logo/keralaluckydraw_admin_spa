export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface RawPaginatedResponse<T> {
  list?: T[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
}

type ListLike<T> = T[] | RawPaginatedResponse<T> | null | undefined;

const isArray = <T>(value: ListLike<T>): value is T[] => Array.isArray(value);

export const toList = <T>(value: ListLike<T>): T[] => {
  if (isArray(value)) return value;
  if (value && isArray(value.list)) return value.list;
  return [];
};

export const toPaginated = <T>(
  value: ListLike<T>,
  fallbackPage: number,
  fallbackSize: number,
): PaginatedResponse<T> => {
  if (isArray(value)) {
    return { list: value, total: value.length, pageNo: fallbackPage, pageSize: fallbackSize };
  }
  return {
    list: value && isArray(value.list) ? value.list : [],
    total: value && typeof value.total === 'number' ? value.total : 0,
    pageNo: value && typeof value.pageNo === 'number' ? value.pageNo : fallbackPage,
    pageSize: value && typeof value.pageSize === 'number' ? value.pageSize : fallbackSize,
  };
};
