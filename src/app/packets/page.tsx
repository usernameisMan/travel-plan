"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { Plus, MapPin, Calendar, Eye, Edit3, Trash2, Share2, Copy, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Packet {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  itineraryDays?: any[];
  createdAt?: string;
  updatedAt?: string;
  shareCode?: string;
  shareType?: string;
  shareViews?: number;
  days?: number;
  places?: number;
}

const PacketsPage = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPacket, setDeletingPacket] = useState<Packet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Share states
  const [sharingPacket, setSharingPacket] = useState<Packet | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showShareConfirmDialog, setShowShareConfirmDialog] = useState(false);
  const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedShareType, setSelectedShareType] = useState<'free' | 'paid'>('free');

  const fetchPackets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure token exists in store with retry logic
      let token = useAuthStore.getState().token;
      if (!token) {
        try {
          token = await getAccessTokenSilently({
            cacheMode: 'on'  // Use cached token if available
          });
          useAuthStore.getState().setToken(token);
        } catch (tokenError) {
          console.error("Failed to get access token:", tokenError);
          throw new Error("Authentication failed. Please log in again.");
        }
      }

      const response = await http.get("/api/packets") as any;
      
      if (response && response.data) {
        const data = response.data.map((item: any) => {
          return {
            ...item,
            title: item.name,
          }
        });
        setPackets(data);
      } else {
        setPackets([]);
      }
    } catch (error) {
      console.error("Error fetching packets:", error);
      setError(t.failedToFetch);
      setPackets([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, t]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Add a delay to ensure token is set by TokenGuard
      // This fixes the race condition on first login
      // Increased delay to give more time for token initialization
      const timer = setTimeout(() => {
        fetchPackets();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, fetchPackets]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getDaysCount = (packet: Packet) => {
    // Priority: use backend calculated value if available
    if (typeof packet.days === 'number') {
      return packet.days;
    }
    // Fallback: calculate from itineraryDays if available
    if (packet.itineraryDays && Array.isArray(packet.itineraryDays)) {
      return packet.itineraryDays.length;
    }
    return 0;
  };

  const getMarkersCount = (packet: Packet) => {
    // Priority: use backend calculated value if available
    if (typeof packet.places === 'number') {
      return packet.places;
    }
    // Fallback: calculate from itineraryDays if available
    if (packet.itineraryDays && Array.isArray(packet.itineraryDays)) {
      return packet.itineraryDays.reduce((total, day) => {
        return total + (day.markers ? day.markers.length : 0);
      }, 0);
    }
    return 0;
  };

  const handleDeletePacket = async (packet: Packet) => {
    if (!packet.id) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      let token = useAuthStore.getState().token;
      if (!token) {
        try {
          token = await getAccessTokenSilently({ cacheMode: 'on' });
          useAuthStore.getState().setToken(token);
        } catch (tokenError) {
          console.error("Failed to get access token:", tokenError);
          setDeleteError(t.authenticationFailed);
          return;
        }
      }

      await http.delete(`/api/packets/${packet.id}`);
      setPackets(prev => prev.filter(p => p.id !== packet.id));
      setDeletingPacket(null);
    } catch (error) {
      console.error("Error deleting packet:", error);
      if (error instanceof Error && error.message.includes('404')) {
        setPackets(prev => prev.filter(p => p.id !== packet.id));
        setDeletingPacket(null);
      } else {
        setDeleteError(error instanceof Error ? error.message : t.error);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Share functionality
  const handleShare = useCallback((packet: Packet) => {
    setSharingPacket(packet);
    
    // If already sharing, show the link dialog directly
    if (packet.shareCode) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/${packet.shareCode}`);
      setShowShareLinkDialog(true);
      return;
    }

    // Show confirmation dialog for new sharing
    setShowShareConfirmDialog(true);
  }, []);

  const handleConfirmShare = useCallback(async () => {
    if (!sharingPacket) return;

    try {
      setShareLoading(true);
      setShareError(null);

      let token = useAuthStore.getState().token;
      if (!token) {
        try {
          token = await getAccessTokenSilently({ cacheMode: 'on' });
          useAuthStore.getState().setToken(token);
        } catch (tokenError) {
          console.error("Failed to get access token:", tokenError);
          setShareError(t.authenticationFailed);
          return;
        }
      }

      const response = await http.post(`/api/packets/${sharingPacket.id}/share`, {
        shareType: selectedShareType
      }) as any;

      if (response && response.data) {
        const shareCode = response.data.shareCode;
        const shareUrl = response.data.shareUrl;
        setShareUrl(shareUrl);
        setPackets(prev => prev.map(p =>
          p.id === sharingPacket.id
            ? { ...p, shareCode, shareType: selectedShareType, shareViews: 0 }
            : p
        ));
        setSharingPacket(prev => prev ? {
          ...prev,
          shareCode,
          shareType: selectedShareType,
          shareViews: 0
        } : null);
        setShowShareConfirmDialog(false);
        setShowShareLinkDialog(true);
      }
    } catch (error) {
      console.error('Error enabling sharing:', error);
      setShareError(t.error);
    } finally {
      setShareLoading(false);
    }
  }, [sharingPacket, selectedShareType, getAccessTokenSilently, t]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl]);

  const handleDisableShare = useCallback(async () => {
    if (!sharingPacket?.shareCode) return;

    try {
      setShareLoading(true);
      setShareError(null);

      let token = useAuthStore.getState().token;
      if (!token) {
        try {
          token = await getAccessTokenSilently({ cacheMode: 'on' });
          useAuthStore.getState().setToken(token);
        } catch (tokenError) {
          console.error("Failed to get access token:", tokenError);
          setShareError(t.authenticationFailed);
          return;
        }
      }

      await http.delete(`/api/packets/${sharingPacket.id}/share`);
      setPackets(prev => prev.map(p =>
        p.id === sharingPacket.id
          ? { ...p, shareCode: undefined, shareType: 'private' }
          : p
      ));
      setShowShareLinkDialog(false);
      setShareUrl('');
      setSharingPacket(null);
    } catch (error) {
      console.error('Error disabling sharing:', error);
      setShareError(t.error);
    } finally {
      setShareLoading(false);
    }
  }, [sharingPacket, getAccessTokenSilently, t]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            {t.verifyingLogin}
          </div>
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.loginRequired}</h1>
          <p className="text-gray-600 mb-6">{t.loginRequiredMessage}</p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-0 shadow-lg">
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.myTravelPlans}</h1>
              <p className="text-gray-600 mt-2">{t.managePlansSubtitle}</p>
            </div>
            <Link href="/createTravelPlan">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 border-0 shadow-lg hover:shadow-xl">
                <Plus className="h-5 w-5" />
                {t.createNewPlan}
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              </div>
              <p className="text-gray-600">{t.loadingPlans}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{t.failedToFetch}</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
            <Button
              onClick={fetchPackets}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 transition-all duration-300 active:scale-95"
            >
              {t.reload}
            </Button>
          </div>
        ) : packets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">✈️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.noPlansYet}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t.noPlansMessage}
            </p>
            <Link href="/createTravelPlan">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-0 shadow-lg">
                {t.createFirstPlan}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {packets.map((packet) => (
              <Card 
                key={packet.id} 
                className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-purple-200"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Status badge */}
                {packet.shareCode && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                      <div className="relative px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {t.publicBadge}
                      </div>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 overflow-hidden mb-1">
                        <div className="line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                          {packet.title || t.untitledPlan}
                        </div>
                      </CardTitle>
                      {packet.destination && (
                        <div className="flex items-center text-sm font-medium text-purple-600 bg-purple-50 rounded-full px-2 py-1 w-fit">
                          <span className="truncate">{packet.destination}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 relative z-10 space-y-4">
                  {packet.description && (
                    <div className="text-sm text-gray-600 bg-white/50 rounded-lg p-3 border border-purple-100">
                      <p className="line-clamp-2">{packet.description}</p>
                    </div>
                  )}
                  
                  {/* Stats section with enhanced design */}
                  <div className="grid grid-cols-2 gap-2">
                    {(packet.startDate || packet.endDate) && (
                      <div className="col-span-2 flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2 border border-blue-100">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 font-medium">{t.travelDates}</div>
                          <div className="text-xs font-semibold text-gray-700 truncate">
                            {formatDate(packet.startDate)} - {formatDate(packet.endDate)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium">{t.days}</div>
                        <div className="text-sm font-bold text-purple-600">{getDaysCount(packet)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-2 border border-orange-100">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium">{t.places}</div>
                        <div className="text-sm font-bold text-orange-600">{getMarkersCount(packet)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {packet.createdAt && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      {t.createdOn} {formatDate(packet.createdAt)}
                    </div>
                  )}

                  {/* Action buttons with enhanced design */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-purple-100">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/createTravelPlan?packetId=${packet.id}`} className="col-span-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg active:scale-95 border-purple-200"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          {t.edit}
                        </Button>
                      </Link>
                      <Link href={`/packets/${packet.id}/view`} className="col-span-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full hover:bg-blue-500 hover:text-white transition-all duration-300 hover:shadow-lg active:scale-95 border-blue-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t.view}
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleShare(packet)}
                        className={cn(
                          "w-full transition-all duration-300 active:scale-95",
                          packet.shareCode
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
                            : "hover:bg-purple-500 hover:text-white border-purple-200 hover:shadow-lg"
                        )}
                      >
                        {packet.shareCode ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                            {t.shared}
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4 mr-1" />
                            {t.shareAction}
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDeletingPacket(packet)}
                        className="w-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-lg active:scale-95 border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t.delete}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPacket} onOpenChange={() => { setDeletingPacket(null); setDeleteError(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.confirmDeleteTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2">
              {t.confirmDeleteMessage} <span className="font-medium">{deletingPacket?.title || t.untitledPlan}</span>?
            </p>
            <p className="text-sm text-red-600 font-medium">
              {t.confirmDeleteWarning}
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeletingPacket(null); setDeleteError(null); }}
              disabled={deleteLoading}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={() => deletingPacket && handleDeletePacket(deletingPacket)}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.deleting}
                </>
              ) : (
                t.confirmDeleteBtn
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Confirmation Dialog */}
      <Dialog open={showShareConfirmDialog} onOpenChange={(open) => { setShowShareConfirmDialog(open); if (!open) setShareError(null); }}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              {t.sharePlanTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">{t.shareDialogIntro}</p>

            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedShareType === 'free'
                    ? "border-purple-500 bg-white shadow-lg scale-105"
                    : "border-gray-200 bg-white/50 hover:border-purple-300"
                )}
                onClick={() => setSelectedShareType('free')}
              >
                <input
                  type="radio"
                  id="free-share"
                  name="shareType"
                  value="free"
                  checked={selectedShareType === 'free'}
                  onChange={(e) => setSelectedShareType(e.target.value as 'free')}
                  className="mt-1 w-4 h-4 text-purple-600"
                />
                <label htmlFor="free-share" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{t.freeSharing}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      {t.recommended}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.freeSharingDesc}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    <span>{t.perfectForSharing}</span>
                  </div>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 opacity-60">
                <input type="radio" id="paid-share" name="shareType" value="paid" disabled className="mt-1 w-4 h-4" />
                <label htmlFor="paid-share" className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-500">{t.premiumSharing}</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                      {t.comingSoon}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{t.premiumSharingDesc}</div>
                </label>
              </div>
            </div>

            {shareError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{shareError}</p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowShareConfirmDialog(false); setShareError(null); }}
              disabled={shareLoading}
              className="hover:bg-gray-100"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleConfirmShare}
              disabled={shareLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
            >
              {shareLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.creating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t.createShareLink}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={showShareLinkDialog} onOpenChange={(open) => { setShowShareLinkDialog(open); if (!open) setShareError(null); }}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-50"></div>
                <div className="relative p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Check className="h-6 w-6 text-white" />
                </div>
              </div>
              {t.shareLinkCreated} 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
              <Label htmlFor="share-link" className="text-sm font-semibold text-gray-700 mb-2 block">
                {t.yourShareLink}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-200 font-mono text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyLink}
                  className={cn(
                    "transition-all duration-300",
                    copied
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {t.copy}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {t.anyoneCanView}
              </p>
            </div>

            {sharingPacket?.shareViews !== undefined && sharingPacket.shareViews > 0 && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{t.totalViews}</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {sharingPacket.shareViews}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                <Share2 className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <div className="text-xs text-gray-600">{t.shareable}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-pink-100">
                <Eye className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                <div className="text-xs text-gray-600">{t.viewOnly}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <Sparkles className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <div className="text-xs text-gray-600">{t.freeLabel}</div>
              </div>
            </div>

            {shareError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{shareError}</p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDisableShare}
              disabled={shareLoading}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              {shareLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  {t.stopping}
                </>
              ) : (
                t.stopSharing
              )}
            </Button>
            <Button
              onClick={() => { setShowShareLinkDialog(false); setSharingPacket(null); setShareError(null); }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              {t.done}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PacketsPage; 