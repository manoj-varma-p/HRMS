import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { AuthSession, AuthUser } from "@/types/auth.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function login(email: string, password: string) {
  return apiFetch<ApiSuccess<AuthSession>>(API_ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh() {
  return apiFetch<ApiSuccess<AuthSession>>(API_ENDPOINTS.AUTH.REFRESH, {
    method: "POST",
  });
}

export function logout() {
  return apiFetch<ApiSuccess<null>>(API_ENDPOINTS.AUTH.LOGOUT, {
    method: "POST",
  });
}

export function setPassword(newPassword: string) {
  return apiFetch<ApiSuccess<AuthSession>>(API_ENDPOINTS.AUTH.SET_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<ApiSuccess<null>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiFetch<ApiSuccess<null>>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function me() {
  return apiFetch<ApiSuccess<{ user: AuthUser }>>(API_ENDPOINTS.AUTH.ME);
}

export function adminResetPassword(userId: string) {
  return apiFetch<ApiSuccess<{ tempPassword: string; user: AuthUser }>>(
    API_ENDPOINTS.AUTH.ADMIN_RESET_PASSWORD(userId),
    { method: "POST" }
  );
}
