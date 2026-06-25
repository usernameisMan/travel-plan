"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Send, X, ChevronDown, ChevronUp, MapPin, Bot, User } from "lucide-react";
import { http } from "@/lib/http";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { DayTrack } from "@/components/traveTracks/Track";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  routeSuggestion?: RouteSuggestion | null;
}

interface PlaceSuggestion {
  name: string;
  type: string;
  description: string;
  lng: number;
  lat: number;
}

interface DaySuggestion {
  dayText: string;
  description: string;
  places: PlaceSuggestion[];
}

interface RouteSuggestion {
  days: DaySuggestion[];
}

interface Props {
  onApplyRoute: (tracks: DayTrack[]) => void;
  currentTracksCount: number;
}

const PLACE_TYPE_TO_MARKER: Record<string, string> = {
  scenic: "studio",
  restaurant: "restaurant",
  hotel: "town-hall",
  shopping: "shopping",
  transport: "airport",
  nature: "forest",
};

function getMarkerType(type: string): string {
  return PLACE_TYPE_TO_MARKER[type?.toLowerCase()] || "star";
}

function routeToTracks(suggestion: RouteSuggestion): DayTrack[] {
  return suggestion.days.map((day, i) => ({
    day: `Day ${i + 1}`,
    dayText: day.dayText || `Day ${i + 1}`,
    description: day.description || "",
    markers: day.places.map((place) => ({
      id: "",
      type: getMarkerType(place.type),
      title: place.name,
      description: place.description || "",
      imgs: [],
      refUrls: [],
      location: {
        lng: String(place.lng),
        lat: String(place.lat),
      },
    })),
  }));
}

const RouteSuggestionCard: React.FC<{
  suggestion: RouteSuggestion;
  onApply: () => void;
  onDismiss: () => void;
  t: ReturnType<typeof useTranslation>;
}> = ({ suggestion, onApply, onDismiss, t }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <span className="font-semibold text-purple-800 text-sm">
            {t.aiPlannerRouteSuggestion} · {suggestion.days.length} {t.aiPlannerDay}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {suggestion.days.map((day, i) => (
            <div key={i} className="rounded-lg bg-white/70 p-3 border border-purple-100">
              <p className="font-medium text-purple-900 text-sm mb-1">{day.dayText}</p>
              {day.description && (
                <p className="text-xs text-gray-500 mb-2">{day.description}</p>
              )}
              <div className="space-y-1">
                {day.places.map((place, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                      {j + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-800">{place.name}</span>
                      {place.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{place.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 px-4 pb-4">
        <Button
          size="sm"
          onClick={onApply}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          {t.aiPlannerApplyRoute}
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} className="flex-shrink-0 active:scale-95 transition-all duration-200">
          {t.aiPlannerDismiss}
        </Button>
      </div>
    </div>
  );
};

const AiPlanner: React.FC<Props> = ({ onApplyRoute, currentTracksCount }) => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: t.aiPlannerWelcome },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<RouteSuggestion | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dismissedRoutes, setDismissedRoutes] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        messages: nextMessages
          .filter((m) => m.role !== "assistant" || m !== messages[0])
          .map((m) => ({ role: m.role, content: m.content })),
      };

      const res = (await http.post("/api/ai/chat", payload)) as any;
      const { reply, routeSuggestion } = res.data || res;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: reply || t.aiPlannerError,
        routeSuggestion: routeSuggestion || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errStatus = (err as any)?.status;
      const errMessage =
        errStatus && errStatus >= 500
          ? t.aiPlannerConfigMissing
          : t.aiPlannerError;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApplyRoute = (suggestion: RouteSuggestion) => {
    setPendingRoute(suggestion);
    setShowConfirm(true);
  };

  const handleConfirmApply = () => {
    if (!pendingRoute) return;
    const tracks = routeToTracks(pendingRoute);
    onApplyRoute(tracks);
    setShowConfirm(false);
    setPendingRoute(null);
    setIsOpen(false);
  };

  const handleDismissRoute = (msgIndex: number) => {
    setDismissedRoutes((prev) => {
      const next = new Set(prev);
      next.add(msgIndex);
      return next;
    });
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
          "hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all duration-200",
          // Desktop: bottom-right above map controls
          "bottom-6 right-6",
          // Hide when panel is open
          isOpen && "hidden"
        )}
        title={t.aiPlannerTitle}
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold hidden sm:inline">{t.aiPlanner}</span>
      </button>

      {/* AI Planner Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              "fixed z-50 bg-white flex flex-col shadow-2xl",
              // Mobile: bottom sheet
              "bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]",
              // Desktop: right side panel
              "md:bottom-4 md:right-4 md:left-auto md:rounded-2xl md:w-[380px] md:max-h-[calc(100vh-5rem)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <div>
                  <p className="font-semibold text-white text-sm">{t.aiPlannerTitle}</p>
                  <p className="text-purple-100 text-xs">{t.aiPlannerSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500"
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex-1 min-w-0",
                      msg.role === "user" && "flex flex-col items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[90%]",
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    {/* Route suggestion card */}
                    {msg.role === "assistant" &&
                      msg.routeSuggestion &&
                      !dismissedRoutes.has(i) && (
                        <div className="w-full">
                          <RouteSuggestionCard
                            suggestion={msg.routeSuggestion}
                            onApply={() => handleApplyRoute(msg.routeSuggestion!)}
                            onDismiss={() => handleDismissRoute(i)}
                            t={t}
                          />
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-gray-100">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.aiPlannerPlaceholder}
                  rows={2}
                  className="flex-1 resize-none text-sm rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 min-h-[52px] max-h-[120px] transition-all duration-200"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 rounded-xl p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 flex-shrink-0 active:scale-95 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm Apply Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t.aiPlannerConfirmTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            {currentTracksCount > 0
              ? t.aiPlannerConfirmReplace
              : t.aiPlannerConfirmAppend}
          </div>
          {pendingRoute && (
            <div className="rounded-lg bg-purple-50 p-3 text-sm space-y-1">
              {pendingRoute.days.map((day, i) => (
                <div key={i} className="flex items-center gap-2 text-purple-800">
                  <span className="font-medium">{day.dayText}</span>
                  <span className="text-purple-400 text-xs">
                    · {day.places.length} {t.aiPlannerPlaces}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:flex-row flex-col">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleConfirmApply}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
            >
              {t.aiPlannerConfirmBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiPlanner;
