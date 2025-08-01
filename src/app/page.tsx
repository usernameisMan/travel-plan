import Image from "next/image";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Plan pin go - Free Travel Plan Editor",
  description:
    "A completely free travel plan editor based on interactive maps. Create, design and share your travel plans effortlessly.",
};

export default function Home() {
  return (
    <main
      className={cn(
        "min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-white via-[#f0f9f4] to-[#e6f5ed] font-poppins",
        poppins.variable
      )}
    >
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            
            {/* Left Side - Main Content */}
            <div className="space-y-8 text-left lg:text-left">
              {/* Hero Title */}
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-tight">
                  <span className="font-poppins font-black">Plan</span><span className="text-[#35b368] font-poppins font-black">Pin</span><span className="font-poppins font-black">Go</span>
                </h1>
                <div className="inline-flex items-center px-6 py-3 bg-[#35b368] text-white text-lg font-bold rounded-full shadow-lg">
                  🎉 100% FREE
                </div>
              </div>

              {/* Hero Description */}
              <div className="space-y-8">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium tracking-wide">
                  <span className="text-[#35b368] font-bold">Completely Free</span> travel
                  plan editor with interactive maps. Design your perfect journey,
                  create custom routes, and share your travel plans with friends.
                </p>

                <div className="bg-gradient-to-r from-[#35b368]/10 to-[#05785e]/10 rounded-2xl p-6 border-l-4 border-[#35b368]">
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    <span className="text-[#05785e] font-bold text-xl">
                      Basic functions are available and still under development 💪💪💪
                    </span>
                    <br />
                    <span className="text-gray-600 font-normal">
                      Have questions? Feel free to contact me via email
                    </span>
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-start">
                <Link href="/createTravelPlan" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-2xl"
                  >
                    Start Planning - FREE
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-[#35b368] text-[#35b368] hover:bg-[#35b368] hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300 rounded-2xl"
                >
                  Coming soon more powers
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
                <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#35b368] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">Interactive Maps</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#35b368] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">Free Forever</span>
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
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover what makes PlanPinGo the perfect travel planning companion
            </p>
          </div>

          {/* Main Feature Demo */}
          <div className="mb-20">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Interactive Map Planning
                  </h3>
                  <p className="text-lg text-gray-600">
                    Create detailed itineraries with our intuitive drag-and-drop interface. 
                    Add locations, customize routes, and visualize your entire journey.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#35b368] text-xl">✓</span>
                      <span className="text-gray-700">Interactive map editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35b368] text-xl">✓</span>
                      <span className="text-gray-700">Unlimited travel plans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35b368] text-xl">✓</span>
                      <span className="text-gray-700">Custom route planning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#35b368] text-xl">✓</span>
                      <span className="text-gray-700">Share with anyone</span>
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
                Plan Your Route
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Design your perfect travel route with our intuitive map interface. 
                Add waypoints, customize paths, and optimize your journey.
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
                Discover Places
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Explore amazing destinations and hidden gems. Get detailed information 
                about attractions, restaurants, and local experiences.
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
                Share Experiences
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Share your travel plans with friends and family. Export itineraries 
                and collaborate on planning your next adventure together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-[#35b368]/20 shadow-xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              ✨ Why Choose Our Free Editor?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50">
                <div className="w-12 h-12 bg-[#35b368] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">Interactive map editor</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50">
                <div className="w-12 h-12 bg-[#35b368] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">Unlimited travel plans</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50">
                <div className="w-12 h-12 bg-[#35b368] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">Custom route planning</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50">
                <div className="w-12 h-12 bg-[#35b368] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <span className="text-lg font-medium text-gray-800">Share with anyone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-[#35b368]/20 shadow-xl text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Contact this website Indie developer
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Have questions or suggestions? I&apos;d love to hear from you!
            </p>
            <div className="inline-flex items-center gap-4 p-6 bg-[#35b368]/10 rounded-2xl">
              <div className="w-12 h-12 bg-[#35b368] rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✉️</span>
              </div>
              <a
                href="mailto:l2025y@foxmail.com"
                className="text-lg font-semibold text-[#35b368] hover:text-[#2d9a5a] transition-colors"
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