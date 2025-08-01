"use client";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useRef } from "react";

interface TokenGuardProps {
  children: React.ReactNode;
}

export default function TokenGuard({ children }: TokenGuardProps) {
  const { isAuthenticated, isLoading, logout, getAccessTokenSilently } = useAuth0();
  const { token, setToken, clearAuth } = useAuthStore();
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Function to validate and refresh token
  const validateToken = async () => {
    if (!isAuthenticated) {
      clearAuth();
      return;
    }

    try {
      // Try to get a fresh token silently
      const freshToken = await getAccessTokenSilently({
        cacheMode: 'off' // Force fresh token validation
      });
      
      if (freshToken !== token) {
        setToken(freshToken);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      
      // If token validation fails, logout the user
      clearAuth();
      logout({
        logoutParams: { returnTo: window.location.origin },
      });
    }
  };

  // Check token validity on mount and when authentication status changes
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Initial token validation
      validateToken();

      // Set up periodic token validation (every 5 minutes)
      tokenCheckInterval.current = setInterval(validateToken, 5 * 60 * 1000);
    } else {
      // Clear token if not authenticated
      clearAuth();
    }

    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
        tokenCheckInterval.current = null;
      }
    };
  }, [isAuthenticated, isLoading]);

  // Global error handler for token expiration
  useEffect(() => {
    const handleUnauthorized = () => {
      if (isAuthenticated) {
        console.warn('Unauthorized access detected, logging out...');
        clearAuth();
        logout({
          logoutParams: { returnTo: window.location.origin },
        });
      }
    };

    // Listen for custom unauthorized events
    window.addEventListener('auth-unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated, logout, clearAuth]);

  return <>{children}</>;
}