// Interfaces separadas
export interface SuccessResponse {
  success: true;
  data: any | null;
}

export interface ErrorResponse {
  success: false;
  errors: string[];
}

export type DefaultResponse = SuccessResponse | ErrorResponse;