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
  onScheduled,
}: {
  url: string;
  name?: string;
  email?: string;
  /** Fires once the visitor books a slot in the embedded widget. */
  onScheduled?: (ev: { eventUri: string; inviteeUri: string }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onScheduled) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as
        | { event?: string; payload?: { event?: { uri?: string }; invitee?: { uri?: string } } }
        | undefined;
      if (data?.event === "calendly.event_scheduled") {
        onScheduled({
          eventUri: data.payload?.event?.uri ?? "",
          inviteeUri: data.payload?.invitee?.uri ?? "",
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onScheduled]);

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
