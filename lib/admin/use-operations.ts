"use client";
import { useEffect, useState, useCallback } from "react";
import { useOperations } from "./operations-store";
import { assignmentService } from "@/services/operations";
export function useOperationsHydration() {
  const ready = useOperations((s) => s.ready);
  useEffect(() => {
    void useOperations.persist.rehydrate();
    const timer = setInterval(() => assignmentService.expireOffers(), 1000);
    return () => clearInterval(timer);
  }, []);
  return ready;
}
// Service-backed loading and retry seam. Async adapters can replace mock readers here.
export function useServiceLoad(loader: () => Promise<unknown>) {
  const [state, setState] = useState<{
    loader: typeof loader | null;
    attempt: number;
    error: string;
  }>({ loader: null, attempt: -1, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loader()
      .then(() => {
        if (active) setState({ loader, attempt, error: "" });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            loader,
            attempt,
            error:
              error instanceof Error ? error.message : "Unable to load data.",
          });
      });
    return () => {
      active = false;
    };
  }, [loader, attempt]);
  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);
  const loading = state.loader !== loader || state.attempt !== attempt;
  return { loading, error: loading ? "" : state.error, retry };
}
