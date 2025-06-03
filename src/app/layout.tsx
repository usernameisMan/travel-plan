"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import classNames from "classnames";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const passName = usePathname();
  return (
    <html lang="en" className={cn(" w-full h-full")}>
      <body className={cn(inter.className, "flex flex-col w-full h-full")}>
        <section className={cn("w-full sticky top-0 z-30 bg-white/80 backdrop-blur shadow-sm")}> 
          <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
            <div className="text-2xl font-bold text-[#35b368] tracking-tight select-none">Travel Plan Creator</div>
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
                </NavigationMenuList>
              </NavigationMenu>
              <button
                className="px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]"
              >
                Login
              </button>
            </div>
          </div>
        </section>
        <section className="w-full h-full">{children}</section>
      </body>
    </html>
  );
}
