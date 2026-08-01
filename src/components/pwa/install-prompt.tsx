"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        background: "#1b1229",
        color: "#fff",
        padding: "16px",
        borderRadius: "16px",
        zIndex: 9999,
        boxShadow: "0 8px 30px rgba(0,0,0,.3)",
      }}
    >
      <h3 style={{ marginBottom: 8 }}>📱 ثبّت تطبيق قولها</h3>

      <p style={{ marginBottom: 16 }}>
        افتح قولها من شاشة هاتفك واستمتع بتجربة أسرع.
      </p>

      <button
        onClick={install}
        style={{
          background: "#7C3AED",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        تثبيت التطبيق
      </button>
    </div>
  );
}