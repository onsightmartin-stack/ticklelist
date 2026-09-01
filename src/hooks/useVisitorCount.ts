import { useEffect, useState } from "react";
import { readVisitorCount, visitorCount } from "@/lib/visitor-count.functions";

/** Persisted per device — a returning visitor never increments again. */
const VISITOR_KEY = "om_visitor_counted";

/** Crawlers and headless agents shouldn't inflate the public visitor counter. */
const isBot = () =>
  typeof navigator !== "undefined" &&
  (/bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|wget/i.test(navigator.userAgent) ||
    (navigator as Navigator & { webdriver?: boolean }).webdriver === true);

export const useVisitorCount = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        let alreadyCounted = true;
        try {
          alreadyCounted = localStorage.getItem(VISITOR_KEY) === "1";
        } catch {
          // storage blocked — treat as counted so we never over-count
        }

        if (alreadyCounted || isBot()) {
          const data = await readVisitorCount();
          if (!cancelled && data?.count != null) setCount(data.count);
          return;
        }

        const data = await visitorCount();
        try {
          localStorage.setItem(VISITOR_KEY, "1");
        } catch {
          /* ignore */
        }
        if (!cancelled && data?.count != null) setCount(data.count);
      } catch {
        // counter is decorative — ignore failures
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
};
