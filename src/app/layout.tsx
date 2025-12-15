"use client";
import { Poppins } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import classNames from "classnames";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AuthProvider from "./AuthProvider";
import AuthButton from "@/components/AuthButton";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LanguageInitializer } from "@/components/language-initializer";
import { LanguageDetectionStatus } from "@/components/language-detection-status";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

function NavigationBar() {
  const passName = usePathname();
  const { isAuthenticated, isLoading } = useAuth0();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  return (
    <section
      className={cn(
        "w-full sticky top-0 z-30 bg-white/80 backdrop-blur shadow-sm"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight select-none">
          <span className="hidden sm:inline">PlanPinGo</span>
          <span className="sm:hidden">PPG</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      passName === "/" && "text-purple-600"
                    )}
                  >
                    {t.home}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {/* <NavigationMenuItem>
                <Link href="/travelPlans" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      passName === "/travelPlans" && "text-purple-600"
                    )}
                  >
                    Travel Plan Repository
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem> */}
              {isAuthenticated && (
                <NavigationMenuItem>
                  <Link href="/packets" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        passName === "/packets" && "text-purple-600"
                      )}
                    >
                      {t.myTravelPlans}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <LanguageSwitcher />
          <AuthButton />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <AuthButton />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-purple-600 hover:bg-purple-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/"
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                passName === "/"
                  ? "text-purple-600 bg-purple-100"
                  : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.home}
            </Link>
            {/* <Link
              href="/travelPlans"
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                passName === "/travelPlans"
                  ? "text-purple-600 bg-purple-100"
                  : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Travel Plans
            </Link> */}
            {isAuthenticated && (
              <Link
                href="/packets"
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  passName === "/packets"
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.myTravelPlans}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("w-full", poppins.variable)}>
      <body className={cn(poppins.className, "flex flex-col w-full min-h-screen font-poppins relative")}>
        {/* Decorative floating elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-slow animation-delay-2000"></div>
          <div className="absolute bottom-32 left-1/4 w-36 h-36 bg-blue-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-purple-400/20 rounded-full blur-2xl animate-float animation-delay-4000"></div>
          <div className="absolute top-1/2 right-10 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-float-slow"></div>
          <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse-glow animation-delay-2000"></div>
        </div>

        <ErrorBoundary>
          <AuthProvider>
            <LanguageInitializer />
            <NavigationBar />
            <main className="w-full flex-1 relative z-10 overflow-y-auto">{children}</main>
            <LanguageDetectionStatus />
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
