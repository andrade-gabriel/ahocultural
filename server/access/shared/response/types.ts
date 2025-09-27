// Interfaces separadas
export interface SuccessResponse {
  success: true;
  errors: null;
}

export interface ErrorResponse {
  success: false;
  errors: string[];
}

export type DefaultResponse = SuccessResponse | ErrorResponse;