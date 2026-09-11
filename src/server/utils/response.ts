import { NextResponse } from 'next/server';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200
): NextResponse {
  return NextResponse.json({ data, meta }, { status });
}
