"use client"
import { Inter as FontSans } from "next/font/google"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import Script from 'next/script';
import React, { useState, useMemo } from "react";
import Image from "next/image";

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
        "min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-white via-[#f0f9f4] to-[#e6f5ed] relative"
      )}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob hidden md:block"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
      <div className="absolute top-1/2 -right-20 w-40 h-40 bg-[#35b368] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Title & subtitle */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Travel Plan C2C Marketplace
          </h1>
          <div className="w-24 h-1 bg-[#35b368] mx-auto rounded-full mb-4"></div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Buy and sell unique travel plans directly between users. <br />
            Created by real travelers, for real travelers. Empower your journey and earn by sharing your own!
          </p>
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col gap-4 mb-8 bg-white/80 rounded-xl shadow p-4">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <input
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#35b368] bg-white text-base"
              placeholder="Search by title, author, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                className="w-full md:w-24 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#35b368] bg-white text-base"
                placeholder="Min $"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="w-full md:w-24 px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#35b368] bg-white text-base"
                placeholder="Max $"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <select
              className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#35b368] bg-white text-base"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="likes">Most Liked</option>
            </select>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#35b368]/10 text-[#35b368] font-semibold hover:bg-[#35b368]/20 transition">
              <i className="icon-[mdi--star-outline] text-lg" />
              <span className="hidden sm:inline">My Favorites</span>
              <span className="sm:hidden">Favorites</span>
            </button>
          </div>
        </div>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            className={cn(
              "px-4 py-1 rounded-full border text-sm font-medium transition",
              !selectedTag ? "bg-[#35b368] text-white border-[#35b368]" : "bg-white text-[#35b368] border-[#35b368] hover:bg-[#35b368]/10"
            )}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={cn(
                "px-4 py-1 rounded-full border text-sm font-medium transition",
                selectedTag === tag ? "bg-[#35b368] text-white border-[#35b368]" : "bg-white text-[#35b368] border-[#35b368] hover:bg-[#35b368]/10"
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
            <div className="col-span-full text-center text-gray-400 py-12 text-lg">No travel plans found.</div>
          )}
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:scale-105 border border-[#e6f5ed] relative cursor-pointer"
              onClick={() => { setActivePlan(plan); setShowDetail(true); }}
            >
              {plan.featured && (
                <div className="absolute top-3 right-3 bg-[#35b368] text-white text-xs font-bold px-3 py-1 rounded-full shadow">Featured</div>
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
                <div className="absolute top-3 left-3 bg-white/80 rounded-full px-3 py-1 text-[#35b368] font-bold text-sm shadow">
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
                    className="rounded-full border border-[#e6f5ed] object-cover"
                  />
                  <span className="text-gray-700 font-medium text-base truncate flex items-center gap-1">
                    Sold by {plan.author}
                    {plan.verified && <i className="icon-[mdi--check-decagram] text-[#35b368] text-lg" title="Verified" />}
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-1 truncate">{plan.title}</div>
                <div className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1 group-hover:line-clamp-none group-hover:bg-[#f0f9f4] group-hover:rounded transition-all duration-300 p-1">
                  {plan.desc}
                </div>
                <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
                  <span className="flex items-center gap-1">
                    <button
                      className={cn("hover:text-pink-500 transition", favoriteIds.includes(plan.id) && "text-pink-500")}
                      onClick={e => { e.stopPropagation(); toggleFavorite(plan.id); }}
                      title={favoriteIds.includes(plan.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <i className={favoriteIds.includes(plan.id) ? "icon-[mdi--heart]" : "icon-[mdi--heart-outline]"} />
                    </button>
                    {plan.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <button className="hover:text-yellow-500 transition" onClick={e => e.stopPropagation()}><i className="icon-[mdi--star-outline]" /></button>
                    {plan.favorites}
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setActivePlan(plan); setShowComment(true); }} className="hover:text-blue-500 transition"><i className="icon-[mdi--comment-outline]" /></button>
                    {plan.comments}
                  </span>
                </div>
                <button
                  className="w-full py-2 rounded-lg bg-[#35b368] text-white font-semibold hover:bg-[#2d9a5a] transition mt-auto text-lg shadow-md"
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
            <button
              className="sticky top-4 right-4 ml-auto z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600 text-xl float-right"
              onClick={() => setShowDetail(false)}
            >
              ×
            </button>
            <div className="p-6 pt-2">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative w-full lg:w-1/2 h-56 lg:h-64 rounded-xl overflow-hidden">
                  <Image src={activePlan.cover} alt={activePlan.title} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Image src={activePlan.avatar} alt={activePlan.author} width={40} height={40} className="rounded-full border border-[#e6f5ed] object-cover" />
                    <span className="text-gray-700 font-medium text-base flex items-center gap-1">
                      Seller: {activePlan.author}
                      {activePlan.verified && <i className="icon-[mdi--check-decagram] text-[#35b368] text-lg" title="Verified" />}
                    </span>
                  </div>
                  <button className="mb-3 px-4 py-2 rounded-full border border-[#35b368] text-[#35b368] text-sm font-semibold hover:bg-[#35b368]/10 transition w-fit">View Seller Profile</button>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">{activePlan.title}</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activePlan.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-[#f0f9f4] text-[#35b368] text-xs font-semibold border border-[#e6f5ed]">{tag}</span>
                    ))}
                  </div>
                  <div className="text-gray-600 text-base mb-4">{activePlan.desc}</div>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="text-[#35b368] font-bold text-xl">${activePlan.price}</span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <i className="icon-[mdi--heart-outline]" /> {activePlan.likes}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <i className="icon-[mdi--star-outline]" /> {activePlan.favorites}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <i className="icon-[mdi--comment-outline]" /> {activePlan.comments}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full py-3 rounded-lg bg-[#35b368] text-white font-semibold hover:bg-[#2d9a5a] transition text-lg shadow-md">
                      Buy this plan
                    </button>
                    <button className="w-full py-3 rounded-lg border border-[#35b368] text-[#35b368] font-semibold hover:bg-[#35b368]/10 transition text-base">
                      Add to cart
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-2 rounded-lg border border-gray-200 text-gray-500 font-semibold hover:bg-gray-100 transition text-base">
                        Share
                      </button>
                      <button className="py-2 rounded-lg border border-blue-200 text-blue-500 font-semibold hover:bg-blue-50 transition text-base">
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
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setShowComment(false)}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                <div className="bg-gray-100 rounded p-3">
                  <div className="font-semibold text-sm mb-1">User A</div>
                  <div className="text-gray-600 text-sm">Very detailed, great route!</div>
                </div>
                <div className="bg-gray-100 rounded p-3">
                  <div className="font-semibold text-sm mb-1">User B</div>
                  <div className="text-gray-600 text-sm">Good value, rich content, recommended!</div>
                </div>
                {/* ...more static comments */}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-3 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#35b368] text-base"
                  placeholder="Write your comment..."
                  disabled
                />
                <button className="px-4 py-3 rounded bg-[#35b368] text-white font-semibold opacity-60 cursor-not-allowed">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TravelPlansMarket;

