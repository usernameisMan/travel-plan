"use client";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }
  return null;
} 