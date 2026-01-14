import type { AxiosError } from 'axios';

export function normalizeError(error: AxiosError | Error) {
  if ('response' in error && error.response) {
    const message =
      typeof error.response.data === 'string'
        ? error.response.data
        : (error.response.data as { message?: string }).message;
    return new Error(message || error.message);
  }

  return error instanceof Error ? error : new Error('Request failed');
}