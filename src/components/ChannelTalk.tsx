"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { q?: unknown[][]; c?: (args: unknown[]) => void };
    ChannelIOInitialized?: boolean;
  }
}

export function ChannelTalk() {
  const pluginKey = process.env.NEXT_PUBLIC_CHANNELTALK_PLUGIN_KEY;

  useEffect(() => {
    if (!pluginKey || window.ChannelIOInitialized) return;

    (function () {
      const ch = function (...args: unknown[]) { ch.c?.(args); } as ((...args: unknown[]) => void) & { q: unknown[][]; c: (args: unknown[]) => void };
      ch.q = [];
      ch.c = function (args: unknown[]) { ch.q.push(args); };
      window.ChannelIO = ch;

      function l() {
        if (window.ChannelIOInitialized) return;
        window.ChannelIOInitialized = true;
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
        document.head.appendChild(s);
      }

      if (document.readyState === "complete") {
        l();
      } else {
        window.addEventListener("DOMContentLoaded", l);
        window.addEventListener("load", l);
      }
    })();

    window.ChannelIO!("boot", { pluginKey, language: "ko" });

    return () => {
      window.ChannelIO?.("shutdown");
    };
  }, [pluginKey]);

  return null;
}
