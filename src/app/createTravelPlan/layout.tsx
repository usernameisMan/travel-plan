"use client";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

export default function TravelPlanLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 进入地图编辑器页面时禁用滚动
        const htmlElement = document.documentElement;
        const bodyElement = document.body;
        
        // 保存原始样式
        const originalHtmlOverflow = htmlElement.style.overflow;
        const originalBodyOverflow = bodyElement.style.overflow;
        const originalHtmlHeight = htmlElement.style.height;
        const originalBodyHeight = bodyElement.style.height;
        
        // 设置固定高度，禁用滚动
        htmlElement.style.overflow = 'hidden';
        bodyElement.style.overflow = 'hidden';
        htmlElement.style.height = '100vh';
        bodyElement.style.height = '100vh';
        
        // 清理函数：离开页面时恢复原始样式
        return () => {
            htmlElement.style.overflow = originalHtmlOverflow;
            bodyElement.style.overflow = originalBodyOverflow;
            htmlElement.style.height = originalHtmlHeight;
            bodyElement.style.height = originalBodyHeight;
        };
    }, []);

    return <section className={cn('w-full h-screen overflow-hidden')}>{children}</section>
}