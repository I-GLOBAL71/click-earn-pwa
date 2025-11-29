import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .then(() => {
      type CacheStorageLike = { keys: () => Promise<string[]>; delete: (key: string) => Promise<boolean> };
      const c = (window as unknown as { caches?: CacheStorageLike }).caches;
      if (c) {
        c.keys().then((keys) => Promise.all(keys.map((k) => c.delete(k))));
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
