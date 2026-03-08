"use client";

import { useI18n } from "@/lib/i18n/context";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { WifiOff, Database, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-kh-bg">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-kh-warning/10 border border-kh-warning/20 flex items-center justify-center">
          <WifiOff size={32} className="text-kh-warning" />
        </div>

        <h1 className="font-display text-display-md text-kh-text mb-3">
          {t.offline.title}
        </h1>
        <p className="text-body-md text-kh-text-muted mb-10 leading-relaxed">
          {t.offline.message}
        </p>

        <Button
          fullWidth
          size="lg"
          onClick={() => router.push("/dashboard")}
          icon={<Database size={18} />}
        >
          {t.offline.viewCached}
        </Button>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 flex items-center gap-2 mx-auto text-body-sm font-medium
            text-kh-text-muted hover:text-kh-accent min-h-[44px] touch-manipulation transition-colors"
        >
          <RefreshCw size={14} />
          {t.common.retry}
        </button>
      </div>
    </div>
  );
}
