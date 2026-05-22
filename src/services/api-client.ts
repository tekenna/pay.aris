"use client";

import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, BusinessSession } from "@/lib/types";
import {
  clearStoredSession,
  getStoredSession,
  redirectToLogin,
  setStoredSession,
} from "@/services/session-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5173/api";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retryOnAuthFailure?: boolean;
};

export type RequestOptions = Omit<AxiosRequestConfig, "baseURL" | "url"> & {
  token?: string;
};

function createConnectionErrorResponse<T>(): ApiResponse<T> {
  return {
    statusCode: 503,
    message: "Unable to connect to Aris Wallex API.",
    data: null as T,
  };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshBusinessAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentSession = getStoredSession();
    if (!currentSession?.refreshToken) {
      clearStoredSession();
      return null;
    }

    try {
      const response = await axios.post<ApiResponse<BusinessSession>>(
        `${API_BASE_URL}/business-auth/refresh`,
        { refreshToken: currentSession.refreshToken },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const payload = response.data;
      if (!payload || payload.statusCode !== 200 || !payload.data?.token) {
        clearStoredSession();
        return null;
      }

      const nextSession: BusinessSession = {
        business: payload.data.business,
        token: payload.data.token,
        refreshToken: payload.data.refreshToken || currentSession.refreshToken,
      };

      setStoredSession(nextSession);
      return nextSession.token;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isRestricted =
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.response?.data?.statusCode === 401 ||
      error.response?.data?.statusCode === 403;

    if (
      originalRequest &&
      originalRequest.headers?.Authorization &&
      !originalRequest._retryOnAuthFailure &&
      originalRequest.url !== "/business-auth/refresh" &&
      isRestricted
    ) {
      originalRequest._retryOnAuthFailure = true;

      const refreshedToken = await refreshBusinessAccessToken();
      if (refreshedToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient.request(originalRequest);
      }

      clearStoredSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export async function apiRequest<T>(
  path: string,
  { token, headers, data, ...options }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const isFormData =
    typeof FormData !== "undefined" && data instanceof FormData;

  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url: path,
      data,
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiResponse<T> | undefined;
      if (payload) {
        return payload;
      }
    }

    return createConnectionErrorResponse<T>();
  }
}

export function withQuery(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  return query ? `${path}?${query}` : path;
}
