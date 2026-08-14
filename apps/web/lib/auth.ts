"use client";

import { api } from "./api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "PLATFORM_OWNER" | "ISP_ADMIN" | "RESELLER" | "CUSTOMER" | "SUPPORT_AGENT";
  organizationId: string;
  customerId: string | null;
}

export interface LoginResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = "netmaster_token";
const REFRESH_KEY = "netmaster_refresh_token";
const USER_KEY = "netmaster_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await api.post<LoginResult>("/auth/login", { email, password });
  window.localStorage.setItem(TOKEN_KEY, result.accessToken);
  window.localStorage.setItem(REFRESH_KEY, result.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

export function logout(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

export function dashboardPathFor(role: string): string {
  switch (role) {
    case "PLATFORM_OWNER":
      return "/admin/dashboard";
    case "ISP_ADMIN":
      return "/dashboard";
    case "RESELLER":
      return "/reseller/dashboard";
    case "CUSTOMER":
      return "/customer/dashboard";
    case "SUPPORT_AGENT":
      return "/support/dashboard";
    default:
      return "/login";
  }
}
