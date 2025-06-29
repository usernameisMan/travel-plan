"use client";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";

import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const setToken = useAuthStore((state) => state.setToken);
  const token = useAuthStore().token;
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
      <div className="px-3 md:px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]">
        Loading...
      </div>
    );

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
          {user?.picture && !imageError ? (
            <Image 
              src={user.picture} 
              alt={user?.name || "User"} 
              width={24}
              height={24}
              className="rounded-full"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#35b368] flex items-center justify-center">
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
          className="px-3 md:px-5 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={() =>
            logout({
              logoutParams: { returnTo: window.location.origin },
            })
          }
        >
          Logout
        </button>
      </div>
    );
  }
  return (
    <Link href="/login">
      <button className="px-3 md:px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]">
        Login
      </button>
    </Link>
  );
}
