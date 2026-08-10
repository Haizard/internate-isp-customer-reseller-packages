"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandaloneNow = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

const isIosDevice = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandaloneNow()) {
      setInstalled(true);
      return;
    }
    if (isIosDevice()) setIsIos(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    const onDisplayModeChange = () => {
      if (isStandaloneNow()) setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("appinstalled", onDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("appinstalled", onDisplayModeChange);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setInstalled(true);
      }
    } else if (isIos) {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstall}
        className="fixed z-40 flex items-center gap-2 pl-3 pr-4 h-11 rounded-pill text-white shadow-lg shadow-accent-blue/30 animate-nudge lg:animate-none left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 bottom-[76px] lg:bottom-6 transition-transform active:scale-95"
        style={{
          background: "linear-gradient(135deg, #5aa7ff 0%, #0a84ff 55%, #0063d6 100%)",
        }}
      >
        <Icon name="download" size={18} variant="line" />
        <span className="text-footnote font-semibold whitespace-nowrap">Install app</span>
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25" onClick={() => setShowIosHelp(false)} aria-hidden />
          <div className="relative w-full max-w-sm glass-strong rounded-2xl p-5 shadow-lg spring">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-title-3 font-semibold text-text-primary">Install NetMaster</h3>
              <button onClick={() => setShowIosHelp(false)} className="text-text-tertiary hover:text-text-primary">
                <Icon name="x" size={20} />
              </button>
            </div>
            <p className="text-footnote text-text-secondary leading-relaxed">
              On iOS, use Safari to open this site, tap the{" "}
              <span className="font-semibold text-accent-blue">Share</span> button, then choose{" "}
              <span className="font-semibold text-accent-blue">Add to Home Screen</span> to install it like a real app.
            </p>
            <button
              onClick={() => setShowIosHelp(false)}
              className="mt-4 w-full h-11 rounded-md text-white font-semibold text-[15px]"
              style={{
                background: "linear-gradient(135deg, #5aa7ff 0%, #0a84ff 55%, #0063d6 100%)",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
