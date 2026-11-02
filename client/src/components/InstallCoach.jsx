import { useCallback, useEffect, useState } from "react";

// "Add to home screen" on both platforms. iOS has no install API, so we show the
// three Share-sheet taps; Chromium fires beforeinstallprompt, which we replay from a click.
// If neither applies we say so instead of showing a dead button.
export function InstallCoach({ x }) {
  const [platform, setPlatform] = useState("unknown");
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone) return setPlatform("installed");
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)) return setPlatform("ios");
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setPlatform("prompt"); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const t = setTimeout(() => setPlatform((p) => (p === "unknown" ? "unsupported" : p)), 1500);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); clearTimeout(t); };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setPlatform("installed");
  }, [deferred]);

  return (
    <div className="card stack install">
      <h2>📲 {x.installH}</h2>
      <p className="small">{x.installWhy}</p>
      {platform === "installed" && <p className="alert ok">{x.installDone}</p>}
      {platform === "ios" && <ol className="steps-list small">{x.installIos.map((s) => <li key={s}>{s}</li>)}</ol>}
      {platform === "prompt" && <button type="button" className="btn narrow" onClick={install}>{x.installBtn}</button>}
      {platform === "unsupported" && <p className="small">{x.installNo}</p>}
    </div>
  );
}

// Registers the service worker (production builds only; it never caches personal pages).
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
export function purgeOfflineCache() {
  try { navigator.serviceWorker?.controller?.postMessage("purge"); } catch {}
}
