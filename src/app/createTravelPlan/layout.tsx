import { cn } from "@/lib/utils";
import React from "react";

export default function TravelPlanLayout({ children }: { children: React.ReactNode }) {
    return <section className={cn('w-full h-full')}>{children}</section>
}