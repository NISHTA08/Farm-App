"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-2.5 px-4
        text-body-sm font-medium transition-all duration-300 animate-slide-up
        ${isOnline ? "bg-kh-accent/90 text-black" : "bg-kh-danger/90 text-white"}
      `}
    >
      {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      <span>{isOnline ? "Back online" : "You are offline"}</span>
    </div>
  );
}
