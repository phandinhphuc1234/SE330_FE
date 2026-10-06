"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthResponse, LoginRequest, MyProfile, UpdateMyProfileRequest } from "../types/auth.type";
import { login as loginRequest, logout as logoutRequest, refreshToken, getMyProfile, updateMyProfile } from "../services/authService";

const ACCESS_TOKEN_STORAGE_KEY = "athenaeumAccessToken";

type AuthContextValue = {
  accessToken: string | null;
  currentUser: MyProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  hasAdminAccess: boolean;
  hasStaffAccess: boolean;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthResponse | null>;
  setAccessToken: (token: string | null) => void;
  updateProfile: (data: { fullName: string; phone?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<MyProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    persistAccessToken(token);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const body = await refreshToken();
      const token = body.data?.accessToken ?? null;
      setAccessToken(token);
      
      // Fetch user profile if token exists
      if (token) {
        try {
          const response = await getMyProfile(token);
          setCurrentUser(response.data ?? null);
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      return body.data ?? null;
    } catch {
      setAccessToken(null);
      setCurrentUser(null);
      return null;
    }
  }, [setAccessToken]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = readStoredAccessToken();

      if (storedToken) {
        setAccessTokenState(storedToken);
        
        // Fetch user profile
        try {
          const response = await getMyProfile(storedToken);
          if (isMounted) {
            setCurrentUser(response.data ?? null);
          }
        } catch {
          if (isMounted) {
            setCurrentUser(null);
          }
        }

        if (isMounted) {
          setIsInitializing(false);
        }

        return;
      }

      try {
        const body = await refreshToken();
        const token = body.data?.accessToken ?? null;

        if (!isMounted) return;

        setAccessToken(token);
        
        // Fetch user profile if token exists
        if (token) {
          try {
            const response = await getMyProfile(token);
            if (isMounted) {
              setCurrentUser(response.data ?? null);
            }
          } catch {
            if (isMounted) {
              setCurrentUser(null);
            }
          }
        }
      } catch {
        if (isMounted) {
          setAccessToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [setAccessToken]);

  const hasAdminAccess = useMemo(() => currentUser?.role === "ADMIN", [currentUser]);
  const hasStaffAccess = useMemo(
    () => currentUser?.role === "LIBRARIAN" || currentUser?.role === "ADMIN",
    [currentUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      currentUser,
      isAuthenticated: Boolean(accessToken),
      isInitializing,
      hasAdminAccess,
      hasStaffAccess,
      login: async (payload) => {
        const body = await loginRequest(payload);
        if (body.data?.accessToken) {
          setAccessToken(body.data.accessToken);
          
          // Fetch user profile after login
          try {
            const response = await getMyProfile(body.data.accessToken);
            setCurrentUser(response.data ?? null);
          } catch {
            setCurrentUser(null);
          }
        }

        return body.data as AuthResponse;
      },
      logout: async () => {
        const token = accessToken;
        setAccessToken(null);
        setCurrentUser(null);

        try {
          if (token) {
            await logoutRequest(token);
          } else {
            const refreshedBody = await refreshToken();
            const refreshedToken = refreshedBody.data?.accessToken;

            if (refreshedToken) {
              await logoutRequest(refreshedToken);
            }
          }
        } catch {
          if (token) {
            await refreshToken()
              .then((body) => {
                const refreshedToken = body.data?.accessToken;
                return refreshedToken ? logoutRequest(refreshedToken) : undefined;
              })
              .catch(() => undefined);
          }
        }

        setAccessToken(null);
        setCurrentUser(null);
        router.replace("/login");
      },
      refresh,
      setAccessToken,
      updateProfile: async (data: UpdateMyProfileRequest) => {
        if (!accessToken) {
          throw new Error("Not authenticated");
        }
        
        const response = await updateMyProfile(data, accessToken);
        setCurrentUser(response.data ?? null);
      },
    }),
    [accessToken, currentUser, isInitializing, hasAdminAccess, hasStaffAccess, refresh, router, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

function readStoredAccessToken() {
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistAccessToken(token: string | null) {
  try {
    if (token) {
      window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Refresh cookies still allow the session to work when web storage is unavailable.
  }
}
