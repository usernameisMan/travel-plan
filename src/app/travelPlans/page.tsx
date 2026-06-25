"use client"
import { Inter as FontSans } from "next/font/google"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import Script from 'next/script';
import React, { useState, useMemo } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
})

const mockPlans = [
  {
    id: 1,
    title: "7-Day Kansai, Japan Adventure",
    author: "Ming Lee",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    desc: "Osaka, Kyoto, Nara, Kobe. Food, culture, and fun for first-timers in Japan!",
    price: 29.9,
    likes: 120,
    favorites: 56,
    comments: 8,
    tags: ["Japan", "City", "Food"],
    featured: true,
    verified: true,
  },
  {
    id: 2,
    title: "10-Day Yunnan Road Trip",
    author: "Ava Traveler",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    cover: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    desc: "Lijiang, Dali, Shangri-La, Lugu Lake. Nature and culture in one epic loop.",
    price: 39.9,
    likes: 98,
    favorites: 40,
    comments: 12,
    tags: ["China", "Nature", "Roadtrip"],
    featured: false,
    verified: false,
  },
  {
    id: 3,
    title: "8-Day Tibet Everest Journey",
    author: "Tibet Explorer",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    cover: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
    desc: "Lhasa, Nyingchi, Everest Base Camp. Sacred mountains and lakes await.",
    price: 49.9,
    likes: 210,
    favorites: 88,
    comments: 23,
    tags: ["China", "Mountain", "Adventure"],
    featured: true,
    verified: true,
  },
  // ...more static data
];

const allTags = Array.from(new Set(mockPlans.flatMap(p => p.tags)));

const TravelPlansMarket = () => {
  const [showComment, setShowComment] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // Search, filter, sort
  const filteredPlans = useMemo(() => {
    let plans = mockPlans.filter(plan => {
      const keyword = search.toLowerCase();
      const match =
        plan.title.toLowerCase().includes(keyword) ||
        plan.author.toLowerCase().includes(keyword) ||
        plan.desc.toLowerCase().includes(keyword);
      const priceOk = (!minPrice || plan.price >= Number(minPrice)) && (!maxPrice || plan.price <= Number(maxPrice));
      const tagOk = !selectedTag || plan.tags.includes(selectedTag);
      return match && priceOk && tagOk;
    });
    if (sort === "price-asc") plans = plans.slice().sort((a, b) => a.price - b.price);
    if (sort === "price-desc") plans = plans.slice().sort((a, b) => b.price - a.price);
    if (sort === "likes") plans = plans.slice().sort((a, b) => b.likes - a.likes);
    if (sort === "featured") plans = plans.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return plans;
  }, [search, minPrice, maxPrice, sort, selectedTag]);

  // Favorites toggle
  const toggleFavorite = (id: number) => {
    setFavoriteIds(fav => fav.includes(id) ? fav.filter(fid => fid !== id) : [...fav, id]);
  };

  return (
    <main
      className={cn(
        "min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-purple-50/40 via-pink-50/20 to-white relative"
      )}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob hidden md:block"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
      <div className="absolute top-1/2 -right-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Title & subtitle */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Travel Plan C2C Marketplace
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-4"></div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Buy and sell unique travel plans directly between users. <br />
            Created by real travelers, for real travelers. Empower your journey and earn by sharing your own!
          </p>
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col gap-4 mb-8 bg-white/80 rounded-2xl shadow-sm border border-purple-100 p-4">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <input
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-base"
              placeholder="Search by title, author, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                className="w-full md:w-24 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-base"
                placeholder="Min $"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="w-full md:w-24 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-base"
                placeholder="Max $"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <select
              className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-base"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="likes">Most Liked</option>
            </select>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-100 text-purple-600 font-semibold hover:bg-purple-200 transition-all duration-200 active:scale-95">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <span className="hidden sm:inline">My Favorites</span>
              <span className="sm:hidden">Favorites</span>
            </button>
          </div>
        </div>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            className={cn(
              "px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 active:scale-95",
              !selectedTag ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm" : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
            )}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={cn(
                "px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 active:scale-95",
                selectedTag === tag ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm" : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
              )}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredPlans.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">No travel plans found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms</p>
              </div>
            </div>
          )}
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 border border-purple-100 relative cursor-pointer active:scale-[0.98]"
              onClick={() => { setActivePlan(plan); setShowDetail(true); }}
            >
              {plan.featured && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Featured</div>
              )}
              <div className="relative h-48 w-full">
                <Image
                  src={plan.cover}
                  alt={plan.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
                <div className="absolute top-3 left-3 bg-white/80 rounded-full px-3 py-1 text-purple-600 font-bold text-sm shadow">
                  ${plan.price}
                </div>
              </div>
              <div className="flex-1 flex flex-col p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={plan.avatar}
                    alt={plan.author}
                    width={36}
                    height={36}
                    className="rounded-full border border-purple-100 object-cover"
                  />
                  <span className="text-gray-700 font-medium text-base truncate flex items-center gap-1">
                    Sold by {plan.author}
                    {plan.verified && <svg className="h-4 w-4 text-purple-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-1 truncate">{plan.title}</div>
                <div className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1 group-hover:line-clamp-none group-hover:bg-purple-50/50 group-hover:rounded-lg transition-all duration-300 p-1">
                  {plan.desc}
                </div>
                <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
                  <span className="flex items-center gap-1">
                    <button
                      className={cn("p-1 rounded-lg hover:bg-pink-50 hover:text-pink-500 transition-all duration-200 active:scale-95", favoriteIds.includes(plan.id) && "text-pink-500")}
                      onClick={e => { e.stopPropagation(); toggleFavorite(plan.id); }}
                      title={favoriteIds.includes(plan.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <svg className="h-4 w-4" fill={favoriteIds.includes(plan.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    {plan.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <button className="p-1 rounded-lg hover:bg-yellow-50 hover:text-yellow-500 transition-all duration-200 active:scale-95" onClick={e => e.stopPropagation()}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    {plan.favorites}
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setActivePlan(plan); setShowComment(true); }} className="p-1 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all duration-200 active:scale-95">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                    {plan.comments}
                  </span>
                </div>
                <button
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all duration-200 active:scale-95 mt-auto text-base shadow-md border-0"
                  onClick={e => e.stopPropagation()}
                >
                  Buy this plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Detail Modal */}
      {showDetail && activePlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 z-10 flex justify-end p-3 bg-white/90 backdrop-blur-sm border-b border-gray-100">
              <button
                className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-all duration-200 active:scale-95"
                onClick={() => setShowDetail(false)}
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 pt-4">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative w-full lg:w-1/2 h-56 lg:h-64 rounded-xl overflow-hidden">
                  <Image src={activePlan.cover} alt={activePlan.title} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Image src={activePlan.avatar} alt={activePlan.author} width={40} height={40} className="rounded-full border border-purple-100 object-cover" />
                    <span className="text-gray-700 font-medium text-base flex items-center gap-1">
                      Seller: {activePlan.author}
                      {activePlan.verified && <svg className="h-4 w-4 text-purple-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    </span>
                  </div>
                  <button className="mb-3 px-4 py-2 rounded-full border border-purple-500 text-purple-600 text-sm font-semibold hover:bg-purple-50 transition w-fit">View Seller Profile</button>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">{activePlan.title}</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activePlan.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-200">{tag}</span>
                    ))}
                  </div>
                  <div className="text-gray-600 text-base mb-4">{activePlan.desc}</div>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold text-xl">${activePlan.price}</span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> {activePlan.likes}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> {activePlan.favorites}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> {activePlan.comments}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all duration-200 active:scale-95 text-base shadow-md border-0">
                      Buy this plan
                    </button>
                    <button className="w-full py-3 rounded-xl border border-purple-300 text-purple-600 font-semibold hover:bg-purple-50 transition-all duration-200 active:scale-95 text-base">
                      Add to cart
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all duration-200 active:scale-95 text-sm">
                        Share
                      </button>
                      <button className="py-2.5 rounded-xl border border-blue-200 text-blue-500 font-semibold hover:bg-blue-50 transition-all duration-200 active:scale-95 text-sm">
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showComment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="text-lg font-bold truncate">Comments for {activePlan?.title}</div>
              <button
                className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-all duration-200 active:scale-95"
                onClick={() => setShowComment(false)}
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="font-semibold text-sm mb-1 text-gray-800">User A</div>
                  <div className="text-gray-600 text-sm">Very detailed, great route!</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="font-semibold text-sm mb-1 text-gray-800">User B</div>
                  <div className="text-gray-600 text-sm">Good value, rich content, recommended!</div>
                </div>
                {/* ...more static comments */}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base transition-all duration-200"
                  placeholder="Write your comment..."
                  disabled
                />
                <button className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold opacity-60 cursor-not-allowed border-0">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TravelPlansMarket;

