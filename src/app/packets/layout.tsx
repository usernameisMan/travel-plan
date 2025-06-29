"use client";
import { cn } from "@/lib/utils";
import React from "react";

export default function PacketsLayout({ children }: { children: React.ReactNode }) {
    return <section className={cn('w-full h-full')}>{children}</section>
} 