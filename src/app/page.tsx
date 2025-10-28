"use client";

import Image from "next/image";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

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
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 -right-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            
            {/* Left Side - Main Content */}
            <div className="space-y-8 text-left lg:text-left">
              {/* Hero Title */}
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-tight">
                  <span className="font-poppins font-black">Plan</span><span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-poppins font-black">Pin</span><span className="font-poppins font-black">Go</span>
                </h1>
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  {t.freeBadge}
                </div>
              </div>

              {/* Hero Description */}
              <div className="space-y-8">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium tracking-wide">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    {language === 'zh' ? '完全免费' : 'Completely Free'}
                  </span>{' '}
                  {t.heroSubtitle.replace('Completely Free ', '')}
                </p>

                <div className="bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-2xl p-6 border-l-4 border-purple-500">
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    <span className="text-purple-700 font-bold text-xl">
                      {t.developmentMessage}
                    </span>
                    <br />
                    <span className="text-gray-600 font-normal">
                      {t.contactMessage}
                    </span>
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-start">
                <Link href="/createTravelPlan" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-2xl border-0"
                  >
                    {t.startPlanningFree}
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300 rounded-2xl"
                >
                  {t.comingSoonPowers}
                </Button>
              </div>
            </div>

            {/* Right Side - Visual Demo */}
            <div className="relative">
              <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/bg.gif"
                  alt="PlanPinGo Demo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Feature Cards */}
              <div className="hidden lg:block">
                <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{t.interactiveMaps}</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{t.freeForever}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Showcase Section */}
      <section className="py-20 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          {/* Features Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.powerfulFeatures}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          {/* Main Feature Demo */}
          <div className="mb-20">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {t.interactiveMapPlanning}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {t.mapPlanningDesc}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 text-xl">✓</span>
                      <span className="text-gray-700">{t.interactiveMapEditor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 text-xl">✓</span>
                      <span className="text-gray-700">{t.unlimitedPlans}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 text-xl">✓</span>
                      <span className="text-gray-700">{t.customRoutePlanning}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 text-xl">✓</span>
                      <span className="text-gray-700">{t.shareWithAnyone}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="/bg.gif"
                      alt="Interactive planning demo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                <Image
                  src="/bg1.png"
                  alt="Plan Your Route"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t.planYourRoute}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t.planRouteDesc}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                <Image
                  src="/bg2.png"
                  alt="Discover Places"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t.discoverPlaces}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t.discoverDesc}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                <Image
                  src="/bg3.png"
                  alt="Share Experiences"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t.shareExperiences}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t.shareDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur-sm rounded-3xl p-12 border border-purple-200 shadow-xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t.whyChoose}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 border border-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">{t.interactiveMapEditor}</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 border border-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">{t.unlimitedPlans}</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 border border-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">{t.customRoutePlanning}</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 border border-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">{t.shareWithAnyone}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-white/80 via-purple-50/50 to-pink-50/50 backdrop-blur-sm rounded-3xl p-12 border border-purple-200 shadow-xl text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              {t.contactDeveloper}
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              {t.contactSubtitle}
            </p>
            <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✉️</span>
              </div>
              <a
                href="mailto:l2025y@foxmail.com"
                className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
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