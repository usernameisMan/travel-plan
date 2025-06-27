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

const inter = Inter({ subsets: ["latin"] });

function NavigationBar() {
  const passName = usePathname();
  const { isAuthenticated, isLoading } = useAuth0();
  
  return (
    <section
      className={cn(
        "w-full sticky top-0 z-30 bg-white/80 backdrop-blur shadow-sm"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="text-2xl font-bold text-[#35b368] tracking-tight select-none">
          Travel Plan Creator
        </div>
        <div className="flex items-center gap-6">
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
                  <Link href="/createTravelPlan" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        passName === "/createTravelPlan" && "text-[#35b368]"
                      )}
                    >
                      Create Travel Plan
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <AuthButton />
        </div>
      </div>
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
        <AuthProvider>
          <NavigationBar />
          <section className="w-full h-full">{children}</section>
        </AuthProvider>
      </body>
    </html>
  );
}
