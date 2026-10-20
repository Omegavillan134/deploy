"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

export default function InstallApp() {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;
  return (
    <button
      onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null); }}
      className="fixed bottom-20 right-4 z-50 btn-primary btn-sm shadow-float lg:bottom-6"
    >
      <Icon name="install_mobile" className=" text-base" /> Install CVSU LMS app
    </button>
  );
}
