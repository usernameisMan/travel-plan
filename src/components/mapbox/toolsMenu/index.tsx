"use client";
import * as React from 'react'
import { cn } from "@/lib/utils";
import { markers } from '../../../constant'
import Image from 'next/image';
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { X } from 'lucide-react';

interface Props {
  className?: string
  onClickMenu?: (fileName: string) => void
  onClose?: () => void
}

const ToolsMenu: React.FC<Props> = ({ className, onClickMenu = (fileName: string) => { }, onClose }) => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-2xl border-2 border-purple-100 overflow-hidden",
      "animate-in fade-in-0 zoom-in-95 duration-200",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{t.quickMarkers}</h3>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
      
      {/* Markers Grid */}
      <div className={cn(
        "p-3",
        isMobile ? "grid grid-cols-4 gap-2" : "grid grid-cols-3 gap-2"
      )}>
        {Array.isArray(markers) && markers.map((marker) => (
          <button
            key={marker.name}
            onClick={() => onClickMenu(marker.fileName)}
            title={marker.name}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-xl min-h-[60px]",
              "bg-gradient-to-br from-purple-50 to-pink-50",
              "border-2 border-purple-100 hover:border-purple-300",
              "transition-all duration-200 active:scale-95",
              "hover:shadow-lg hover:shadow-purple-100"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-purple-200 flex items-center justify-center shadow-sm">
              <Image
                src={`/markers/resized/${marker.fileName}.png`}
                alt={marker.name}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            {!isMobile && (
              <span className="text-xs font-medium text-gray-700 text-center line-clamp-1 w-full">
                {marker.name}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ToolsMenu; 