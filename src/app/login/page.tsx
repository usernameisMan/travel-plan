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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
          <p className="mt-4 text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">✓</span>
            </div>
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.redirecting}
          </p>
        </div>
      </div>
    );
  }
  return null;
} 