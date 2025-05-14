import Image from "next/image";
import { Inter as FontSans } from "next/font/google"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function Home() {
  return (
    <main className={cn("flex min-h-screen flex-col items-center justify-between p-24", fontSans.variable)}>
      / page
    </main>
  );
}

