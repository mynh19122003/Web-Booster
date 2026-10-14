"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { publicRequest } from "@/services/public";
import type { CustomerRequest } from "@/lib/chat-types";

export function OrderTracking() {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    publicRequest("/api/requests", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return { requests: [] };
        if (!response.ok) throw new Error("requests-unavailable");
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setRequests(Array.isArray(data.requests) ? data.requests : []);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("unavailable"); });
    return () => controller.abort();
  }, []);

  return (
    <section className="section tracking-section">
      <div className="site-container">
        <p className="eyebrow">{t("trackingEyebrow")}</p>
        <h2>{t("everyMatch")} · {t("everyMilestone")}</h2>
        {status === "loading" && <p role="status">{translateText(language, "Loading requests…", "Đang tải yêu cầu…")}</p>}
        {status === "unavailable" && <p role="alert">{translateText(language, "Order tracking is unavailable.", "Chưa thể tải trạng thái đơn hàng.")}</p>}
        {status === "ready" && requests.length === 0 && <p>{translateText(language, "No requests yet.", "Bạn chưa có yêu cầu nào.")}</p>}
        {status === "ready" && requests.length > 0 && (
          <ul>
            {requests.slice(0, 3).map((request) => (
              <li key={request.id}>
                <Link href={`/messages?request=${encodeURIComponent(request.id)}`}>
                  <strong>{request.subject}</strong> · {request.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
