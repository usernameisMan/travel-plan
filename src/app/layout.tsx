"use client";
import { Inter } from "next/font/google";
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

const inter = Inter({ subsets: ["latin"] });

function NavigationBar() {
  const passName = usePathname();
  const { isAuthenticated, isLoading } = useAuth0();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <section
      className={cn(
        "w-full sticky top-0 z-30 bg-white/80 backdrop-blur shadow-sm"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="text-lg md:text-2xl font-bold text-[#35b368] tracking-tight select-none">
          <span className="hidden sm:inline">Travel Plan Creator</span>
          <span className="sm:hidden">TPC</span>
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
                      passName === "/" && "text-[#35b368]"
                    )}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/travelPlans" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      passName === "/travelPlans" && "text-[#35b368]"
                    )}
                  >
                    Travel Plan Repository
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {isAuthenticated && (
                <NavigationMenuItem>
                  <Link href="/packets" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        passName === "/packets" && "text-[#35b368]"
                      )}
                    >
                      My Travel Plans
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <AuthButton />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <AuthButton />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-[#35b368] hover:bg-[#35b368]/10 transition-colors"
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
                  ? "text-[#35b368] bg-[#35b368]/10"
                  : "text-gray-700 hover:text-[#35b368] hover:bg-[#35b368]/5"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/travelPlans"
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                passName === "/travelPlans"
                  ? "text-[#35b368] bg-[#35b368]/10"
                  : "text-gray-700 hover:text-[#35b368] hover:bg-[#35b368]/5"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Travel Plans
            </Link>
            {isAuthenticated && (
              <Link
                href="/packets"
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  passName === "/packets"
                    ? "text-[#35b368] bg-[#35b368]/10"
                    : "text-gray-700 hover:text-[#35b368] hover:bg-[#35b368]/5"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Travel Plans
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
    <html lang="en" className={cn(" w-full h-full")}>
      <body className={cn(inter.className, "flex flex-col w-full h-full")}>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationBar />
            <section className="w-full h-full">{children}</section>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
