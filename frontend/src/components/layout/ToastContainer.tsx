"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useToastStore from "@/store/useToastStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-8 left-1/2 z-[200] flex w-full max-w-2xl -translate-x-1/2 flex-col items-center gap-3 px-6 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex w-max max-w-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
          >
            {/* 상단 포인트 바 */}
            <div
              className={cn(
                "h-1 w-full",
                toast.type === "success" && "bg-[#4D41FF]",
                toast.type === "error" && "bg-red-500",
                toast.type === "info" && "bg-[#0033FF]"
              )}
            />

            <div className="flex items-center gap-4 px-6 py-4">
              {/* 아이콘 */}
              {toast.type === "success" && <CheckCircle size={18} className="text-[#4D41FF] shrink-0" />}
              {toast.type === "error" && <AlertCircle size={18} className="text-red-500 shrink-0" />}
              {toast.type === "info" && <Info size={18} className="text-[#0033FF] shrink-0" />}

              <span className="min-w-0 max-w-[min(32rem,calc(100vw-5.5rem))] text-sm font-black leading-relaxed tracking-tight text-black break-keep">
                {toast.message}
              </span>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-300 transition-colors hover:text-black"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
