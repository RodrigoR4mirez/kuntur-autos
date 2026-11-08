export interface ApiError {
  readonly error: { readonly code: string; readonly message: string };
}

export const apiError = (code: string, message: string): ApiError => ({ error: { code, message } });
