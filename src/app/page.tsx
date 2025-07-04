import Image from "next/image";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Plan pin go - Free Travel Plan Editor",
  description:
    "A completely free travel plan editor based on interactive maps. Create, design and share your own travel plans effortlessly.",
};

export default function Home() {
  return (
    <main
      className={cn(
        "min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-white via-[#f0f9f4] to-[#e6f5ed]",
        fontSans.variable
      )}
    >
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          {/* Decorative elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob hidden md:block"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
          <div className="absolute top-1/2 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>

          <div className="relative">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
              PlanPinGo
            </h1>
            <div className="inline-flex items-center px-4 py-2 bg-[#35b368] text-white text-sm font-semibold rounded-full mb-4">
              🎉 100% FREE
            </div>
            <div className="w-24 h-1 bg-[#35b368] mx-auto rounded-full"></div>
          </div>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            <strong className="text-[#35b368]">Completely Free</strong> travel
            plan editor with interactive maps. Design your perfect journey,
            create custom routes, and share your travel plans with friends.
          </p>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            <strong className="text-[#05785e]">
              Basic functions are available and still under development 💪💪💪{" "}
            </strong>
            you can tall me your question use email
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link href="/createTravelPlan" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Start Planning - FREE
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-[#35b368] text-[#35b368] hover:bg-[#35b368] hover:text-white px-8 py-6 text-lg transition-all duration-300"
            >
              Coming song more powers
            </Button>
          </div>

          {/* Free Features Highlight */}
          <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#35b368]/20 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ✨ Why Choose Our Free Editor?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-[#35b368]">✓</span>
                Interactive map editor
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35b368]">✓</span>
                Unlimited travel plans
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35b368]">✓</span>
                Custom route planning
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35b368]">✓</span>
                Share with anyone
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 px-4">
            <div className="relative h-48 rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1488085061387-422e29b40080"
                alt="Travel planning"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                Plan Your Route
              </div>
            </div>
            <div className="relative h-48 rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"
                alt="Discover places"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                Discover Places
              </div>
            </div>
            <div className="relative h-48 rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                alt="Share experiences"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                Share Experiences
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#35b368]/20 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact this web site Indie developer
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#35b368]">✉️</span>
                <a
                  href="mailto:l2025y@foxmail.com"
                  className="hover:text-[#35b368] transition-colors"
                >
                  LenLi l2025y@foxmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
