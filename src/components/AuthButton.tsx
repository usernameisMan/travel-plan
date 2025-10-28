"use client";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const setToken = useAuthStore((state) => state.setToken);
  const token = useAuthStore().token;
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const { isAuthenticated, logout, isLoading, user, getAccessTokenSilently } =
    useAuth0();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchToken = async () => {
      try {
        const token = await getAccessTokenSilently();
        setToken(token as any);
      } catch (error) {
        console.error("Failed to get access token:", error);
      }
    };
    fetchToken();
  }, [getAccessTokenSilently, setToken, isAuthenticated]);

  useEffect(() => {
    if (token) {
      const getUserInfo = async () => {
        try {

        } catch (error) {
          console.error("Failed to get user info:", error);
        }
      };
      getUserInfo();
    }
  }, [token]);

  if (isLoading)
    return (
      <div className="px-3 md:px-5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-lg transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-400">
        {t.loading}
      </div>
    );

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          {user?.picture && !imageError ? (
            <Image 
              src={user.picture} 
              alt={user?.name || "User"} 
              width={24}
              height={24}
              className="rounded-full ring-2 ring-purple-300"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
            {user?.name || "User"}
          </span>
        </div>
        <button
          className="px-3 md:px-5 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={() =>
            logout({
              logoutParams: { returnTo: window.location.origin },
            })
          }
        >
          {t.logout}
        </button>
      </div>
    );
  }
  return (
    <Link href="/login">
      <button className="px-3 md:px-5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-400">
        {t.login}
      </button>
    </Link>
  );
}
