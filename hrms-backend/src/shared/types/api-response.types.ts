export interface ApiSuccessBody<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors: unknown[];
}
