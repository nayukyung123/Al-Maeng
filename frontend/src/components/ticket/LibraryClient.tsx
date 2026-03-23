"use client";

import React, { useState } from "react";
import { CardGallery } from "./CardGallery";
import { TicketBinder } from "./TicketBinder";
import { cn } from "@/lib/utils";

export const LibraryClient = () => {
  const [activeTab, setActiveTab] = useState<"gallery" | "binder">("gallery");

  return (
    <div className="w-full min-h-screen bg-stone-50 flex flex-col pt-16">
      {/* 탭 네비게이션 */}
      <div className="w-full flex justify-center py-6 bg-white/50 backdrop-blur-sm border-b border-black/5 z-20">
        <div className="flex gap-4 p-1 bg-black/5 rounded-full">
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all",
              activeTab === "gallery" 
                ? "bg-white text-[#0033FF] shadow-sm" 
                : "text-black/50 hover:text-black"
            )}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab("binder")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all",
              activeTab === "binder" 
                ? "bg-white text-[#0033FF] shadow-sm" 
                : "text-black/50 hover:text-black"
            )}
          >
            Binder
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 w-full relative">
        {activeTab === "gallery" ? <CardGallery /> : <TicketBinder />}
      </div>
    </div>
  );
};
