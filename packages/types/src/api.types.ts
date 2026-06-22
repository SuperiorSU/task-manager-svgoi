export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: { page: number; limit: number; total: number; totalPages: number };
};
