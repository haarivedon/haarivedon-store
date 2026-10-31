"use client";

import { useEffect, useRef } from "react";

type CalendlyGlobal = {
  initInlineWidget: (opts: {
    url: string;
    parentElement: HTMLElement;
    prefill?: { name?: string; email?: string };
  }) => void;
};

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const CSS_HREF = "https://assets.calendly.com/assets/external/widget.css";

/**
 * Inline Calendly scheduler. The URL is admin-set (Book page copy); if it's
 * empty the caller renders a fallback instead of this. Uses the explicit
 * initInlineWidget API so it works with a React-rendered container.
 */
export function CalendlyScheduler({
  url,
  name,
  email,
}: {
  url: string;
  name?: string;
  email?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      document.head.appendChild(link);
    }

    const init = () => {
      if (cancelled || !ref.current) return;
      const calendly = (window as unknown as { Calendly?: CalendlyGlobal })
        .Calendly;
      if (!calendly) return;
      ref.current.innerHTML = "";
      calendly.initInlineWidget({
        url,
        parentElement: ref.current,
        prefill: { name, email },
      });
    };

    if ((window as unknown as { Calendly?: CalendlyGlobal }).Calendly) {
      init();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", init, { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, [url, name, email]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-border/60"
      style={{ minWidth: "320px", height: "700px" }}
    />
  );
}
