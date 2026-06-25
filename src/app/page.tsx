"use client";

import Image from "next/image";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Sparkles, MessageSquare, Map, CheckCircle, MapPin, Bot, User } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

// ─── Animated AI chat demo ─────────────────────────────────────────────────────
function AiChatDemo({ t }: { t: any }) {
  const [stage, setStage] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // Stage 0→1: user msg appears, 1→2: thinking dots, 2→3: AI reply, then reset
    const delays = [900, 2000, 3400, 8000];
    const timers = [
      setTimeout(() => setStage(1), delays[0]),
      setTimeout(() => setStage(2), delays[1]),
      setTimeout(() => setStage(3), delays[2]),
      setTimeout(() => { setStage(0); setCycle((c) => c + 1); }, delays[3]),
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle]); // re-runs each cycle

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden w-full max-w-sm mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">PlanPinGo AI</p>
          <p className="text-purple-100 text-xs">{t.aiPlannerSubtitle}</p>
        </div>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/70 text-xs">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[220px] bg-gray-50/50">
        {/* Welcome */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-xs text-gray-700 max-w-[85%]">
            {t.aiPlannerWelcome}
          </div>
        </div>

        {/* User message */}
        {stage >= 1 && (
          <div className="flex gap-2 flex-row-reverse animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[85%]">
              {t.aiChatUserMsg}
            </div>
          </div>
        )}

        {/* Thinking */}
        {stage === 2 && (
          <div className="flex gap-2 animate-in fade-in-0 duration-300">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-xs text-gray-500 italic max-w-[85%]">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="ml-1">{t.aiChatThinking}</span>
              </span>
            </div>
          </div>
        )}

        {/* AI route reply */}
        {stage >= 3 && (
          <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-xs text-gray-700">
                {t.aiPlannerRouteSuggestion} ✨
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 px-3 py-2.5 space-y-1.5">
                {[t.aiChatDay1, t.aiChatDay2, t.aiChatDay3].map((day, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-purple-400 flex-shrink-0" />
                    <span className="text-purple-800 font-medium">{day}</span>
                  </div>
                ))}
                <button className="mt-1 w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg">
                  {t.aiChatApplyBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { language } = useLanguageStore();
  const t = useTranslation(language);

  return (
    <main
      className={cn(
        "min-h-screen w-full overflow-x-hidden font-poppins",
        poppins.variable
      )}
    >
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16 sm:py-12">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div className="space-y-6 sm:space-y-8 text-left order-1">
              {/* Brand + AI badge */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-gray-900 leading-tight">
                  <span>Plan</span>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pin</span>
                  <span>Go</span>
                </h1>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow">
                    {t.freeBadge}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-full shadow">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.aiPoweredBadge}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed font-medium max-w-lg">
                {t.heroSubtitleNew}
              </p>

              {/* Dev notice */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-l-4 border-purple-400">
                <p className="text-purple-700 font-semibold text-sm sm:text-base">
                  {t.developmentMessage}
                </p>
                <p className="text-gray-500 text-sm mt-1">{t.contactMessage}</p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/createTravelPlan" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-base sm:text-lg font-semibold rounded-2xl border-0 hover:scale-105 hover:shadow-xl transition-all duration-300"
                  >
                    <Sparkles className="h-5 w-5" />
                    {t.tryAiPlanning}
                  </Button>
                </Link>
                <Link href="/createTravelPlan" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-500 hover:text-white px-8 py-6 text-base sm:text-lg font-semibold rounded-2xl transition-all duration-300"
                  >
                    {t.startPlanningFree}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — animated AI demo */}
            <div className="order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm lg:max-w-md">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-20 scale-105" />
                <AiChatDemo t={t} />

                {/* Floating badges — desktop only */}
                <div className="hidden lg:block">
                  <div className="absolute -top-5 -left-6 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-purple-100 text-xs font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    {t.interactiveMaps}
                  </div>
                  <div className="absolute -bottom-5 -right-6 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-pink-100 text-xs font-medium text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    {t.freeForever}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {t.howItWorksTitle}
            </h2>
            <p className="text-gray-500 text-lg">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-gradient-to-r from-purple-200 via-purple-400 to-pink-300" />

            {[
              {
                icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
                title: t.step1Title,
                desc: t.step1Desc,
                color: "from-purple-100 to-purple-50",
                border: "border-purple-200",
                num: "01",
              },
              {
                icon: <Sparkles className="h-6 w-6 text-pink-600" />,
                title: t.step2Title,
                desc: t.step2Desc,
                color: "from-pink-100 to-pink-50",
                border: "border-pink-200",
                num: "02",
              },
              {
                icon: <Map className="h-6 w-6 text-indigo-600" />,
                title: t.step3Title,
                desc: t.step3Desc,
                color: "from-indigo-100 to-indigo-50",
                border: "border-indigo-200",
                num: "03",
              },
            ].map((step) => (
              <div
                key={step.num}
                className={cn(
                  "relative bg-gradient-to-br rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300",
                  step.color,
                  step.border
                )}
              >
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                  {step.num}
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-white">
                  {step.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Feature Highlight ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-purple-100">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left — screenshot/mockup */}
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-6 sm:p-10 flex items-center justify-center min-h-[320px] sm:min-h-[400px]">
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "24px 24px"
                  }}
                />
                {/* Mini chat inside the highlight section */}
                <div className="relative w-full max-w-xs bg-white/10 backdrop-blur rounded-2xl border border-white/20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/20 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-semibold">AI Planner</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-white/20 rounded-xl rounded-tr-sm px-3 py-2 text-white text-xs max-w-[80%]">
                        {t.aiChatUserMsg}
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-xl rounded-tl-sm px-3 py-2.5 text-white/90 text-xs space-y-1.5">
                      <p className="font-medium text-white mb-2">{t.aiPlannerRouteSuggestion} ✨</p>
                      {[t.aiChatDay1, t.aiChatDay2, t.aiChatDay3].map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <span>{d}</span>
                        </div>
                      ))}
                      <button className="mt-2 w-full py-1.5 bg-white text-purple-600 text-xs font-bold rounded-lg">
                        {t.aiChatApplyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — text */}
              <div className="p-6 sm:p-10 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full w-fit">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-purple-700 text-sm font-semibold">{t.heroAiHighlight}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                  {t.aiFeatureSectionTitle}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {t.aiFeatureSectionDesc}
                </p>
                <ul className="space-y-3">
                  {[
                    t.aiFeatureBullet1,
                    t.aiFeatureBullet2,
                    t.aiFeatureBullet3,
                    t.aiFeatureBullet4,
                  ].map((bullet, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/createTravelPlan">
                  <Button className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl border-0 font-semibold transition-all hover:scale-105 hover:shadow-lg">
                    <Sparkles className="h-4 w-4" />
                    {t.tryAiPlanning}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.powerfulFeatures}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          {/* Large feature */}
          <div className="mb-8 rounded-3xl overflow-hidden shadow-xl bg-white border border-purple-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
              <div className="p-8 sm:p-10 flex flex-col justify-center space-y-5 order-2 lg:order-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t.interactiveMapPlanning}
                </h3>
                <p className="text-gray-600 leading-relaxed">{t.mapPlanningDesc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[t.interactiveMapEditor, t.unlimitedPlans, t.customRoutePlanning, t.shareWithAnyone].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-56 sm:h-72 lg:h-auto order-1 lg:order-2 min-h-[220px]">
                <Image
                  src="/bg.gif"
                  alt="Interactive planning demo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-black/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* 3-card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { img: "/bg1.png", title: t.planYourRoute, desc: t.planRouteDesc },
              { img: "/bg2.png", title: t.discoverPlaces, desc: t.discoverDesc },
              { img: "/bg3.png", title: t.shareExperiences, desc: t.shareDesc },
            ].map((card) => (
              <div
                key={card.title}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur rounded-3xl p-8 sm:p-12 border border-purple-200 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t.whyChoose}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[t.interactiveMapEditor, t.unlimitedPlans, t.customRoutePlanning, t.shareWithAnyone].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 border border-purple-100 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur rounded-3xl p-8 sm:p-12 border border-purple-200 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {t.contactDeveloper}
            </h3>
            <p className="text-gray-600 mb-8">{t.contactSubtitle}</p>
            <div className="inline-flex items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">✉️</span>
              </div>
              <a
                href="mailto:l2025y@foxmail.com"
                className="text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                LenLi l2025y@foxmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
