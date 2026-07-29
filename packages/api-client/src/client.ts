import type { ApiError, ApiResponse } from '@godigitify/types';

type ClientConfig = {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => void;
  /** Platform lock (directive §5): sent as `x-client-platform`. mobile | web. */
  platform?: 'mobile' | 'web';
  /** Web uses httpOnly cookies — set to 'include' so fetch sends them. */
  credentials?: 'include' | 'omit' | 'same-origin';
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

export class ApiClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  private buildUrl(path: string, params?: RequestOptions['params']): string {
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const token = await this.config.getToken();
    const hasBody = options.body !== undefined && options.body !== null;
    const headers: Record<string, string> = {};
    // Only advertise a JSON body when one is actually sent. Fastify rejects a
    // request that carries `Content-Type: application/json` with an empty body
    // ("Body cannot be empty…"), which broke every bodyless PATCH/POST such as
    // marking a notification read.
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.config.platform) headers['x-client-platform'] = this.config.platform;

    const response = await fetch(this.buildUrl(path, options.params), {
      method: options.method ?? 'GET',
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      ...(this.config.credentials ? { credentials: this.config.credentials } : {}),
    });

    if (response.status === 401) {
      this.config.onUnauthorized();
    }

    const data = (await response.json()) as ApiResponse<T> | ApiError;

    if (!response.ok || !data.success) {
      throw data as ApiError;
    }

    return data as ApiResponse<T>;
  }

  get<T>(path: string, params?: RequestOptions['params']) {
    return this.request<T>(path, { method: 'GET', ...(params ? { params } : {}) });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

let _client: ApiClient | null = null;

export const initApiClient = (config: ClientConfig): ApiClient => {
  _client = new ApiClient(config);
  return _client;
};

export const getApiClient = (): ApiClient => {
  if (!_client) throw new Error('API client not initialized. Call initApiClient first.');
  return _client;
};
