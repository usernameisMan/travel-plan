"use client";
import { Auth0Provider } from "@auth0/auth0-react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "dev-jm3p0fl7ukqun2o5.us.auth0.com"}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "SdCXKYIoR8oRbxZl7FzNKh6giVdxAhSm"}
      authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
        audience: "https://travel-plan-api",
      }}
    >
      {children}
    </Auth0Provider>
  );
} 