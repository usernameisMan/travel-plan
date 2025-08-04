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
import { Plus, MapPin, Calendar, Eye, Edit3, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

  const fetchPackets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure token exists in store
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
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
      fetchPackets();
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
    if (packet.itineraryDays && Array.isArray(packet.itineraryDays)) {
      return packet.itineraryDays.length;
    }
    return 0;
  };

  const getMarkersCount = (packet: Packet) => {
    if (packet.itineraryDays && Array.isArray(packet.itineraryDays)) {
      return packet.itineraryDays.reduce((total, day) => {
        return total + (day.markers ? day.markers.length : 0);
      }, 0);
    }
    return 0;
  };

  const handleDeletePacket = async (packet: Packet) => {
    if (!packet.id) {
      alert("Invalid packet ID");
      return;
    }

    try {
      setDeleteLoading(true);
      
      // Ensure token exists
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      const response = await http.delete(`/api/packets/${packet.id}`);
      console.log("Delete response:", response);

      // Remove deleted packet from list
      setPackets(prev => prev.filter(p => p.id !== packet.id));
      
      alert("Travel plan deleted successfully!");
    } catch (error) {
      console.error("Error deleting packet:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          alert("Authentication failed, please log in again");
        } else if (error.message.includes('404')) {
          alert("Travel plan does not exist or has been deleted");
          // Remove from list even if 404 (might have been deleted elsewhere)
          setPackets(prev => prev.filter(p => p.id !== packet.id));
        } else {
          alert(`Delete failed: ${error.message}`);
        }
      } else {
        alert("Unknown error occurred while deleting travel plan");
      }
    } finally {
      setDeleteLoading(false);
      setDeletingPacket(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            {t.verifyingLogin}
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.loginRequired}</h1>
          <p className="text-gray-600 mb-6">{t.loginRequiredMessage}</p>
          <Link href="/login">
            <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.myTravelPlans}</h1>
              <p className="text-gray-600 mt-2">{t.managePlansSubtitle}</p>
            </div>
            <Link href="/createTravelPlan">
              <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto mb-4"></div>
              <p className="text-gray-600">{t.loadingPlans}</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={fetchPackets}
              variant="outline"
              className="hover:bg-[#35b368] hover:text-white transition-colors"
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
              <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                {t.createFirstPlan}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {packets.map((packet) => (
              <Card key={packet.id} className="hover:shadow-lg transition-shadow duration-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 overflow-hidden">
                    <div className="line-clamp-2">{packet.title || t.untitledPlan}</div>
                  </CardTitle>
                  {packet.destination && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {packet.destination}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {packet.description && (
                    <div className="text-sm text-gray-600 mb-4 overflow-hidden">
                      <p className="line-clamp-2">{packet.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    {(packet.startDate || packet.endDate) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(packet.startDate)} - {formatDate(packet.endDate)}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{getDaysCount(packet)} {t.dayItinerary}</span>
                      <span>{getMarkersCount(packet)} {t.attractions}</span>
                    </div>
                    
                    {packet.createdAt && (
                      <div className="text-xs text-gray-500">
                        {t.createdOn} {formatDate(packet.createdAt)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                    <Link href={`/createTravelPlan?packetId=${packet.id}`} className="col-span-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full hover:bg-[#35b368] hover:text-white transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        {t.edit}
                      </Button>
                    </Link>
                    <Link href={`/packets/${packet.id}/view`} className="col-span-1 sm:flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.view}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDeletingPacket(packet)}
                      className="col-span-2 sm:col-span-auto sm:w-auto hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0 mr-1" />
                      <span className="sm:hidden">{t.delete}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPacket} onOpenChange={() => setDeletingPacket(null)}>
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPacket(null)}
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
    </div>
  );
};

export default PacketsPage; 