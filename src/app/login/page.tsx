"use client";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();
  const setToken = useAuthStore((state) => state.setToken);
  const { language } = useLanguageStore();
  const t = useTranslation(language);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          setToken(token);
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently, setToken]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">{t.loading}</div>;
  }

  if (isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return <div className="flex justify-center items-center h-screen">{t.redirecting}</div>;
  }
  return null;
} 