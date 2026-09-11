export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);

  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
