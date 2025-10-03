// Interfaces separadas
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  errors: string[];
}

export type DefaultResponse<T> = SuccessResponse<T> | ErrorResponse;