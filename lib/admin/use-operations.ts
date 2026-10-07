"use client";
import { useEffect, useState, useCallback } from "react";
import { ApiFeatureUnavailableError } from "@/lib/api/errors";
import { adminError } from "@/lib/admin/vi";
export function useServiceLoad<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<{
    loader: typeof loader | null;
    attempt: number;
    error: string;
    unavailable: boolean;
    data: T | undefined;
    empty: boolean;
  }>({
    loader: null,
    attempt: -1,
    error: "",
    unavailable: false,
    data: undefined,
    empty: false,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loader()
      .then((data) => {
        if (active)
          setState({
            loader,
            attempt,
            error: "",
            unavailable: false,
            data,
            empty: data === null || (Array.isArray(data) && data.length === 0),
          });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            loader,
            attempt,
            error:
              error instanceof ApiFeatureUnavailableError
                ? ""
                : adminError(error),
            unavailable: error instanceof ApiFeatureUnavailableError,
            data: undefined,
            empty: false,
          });
      });
    return () => {
      active = false;
    };
  }, [loader, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const loading = state.loader !== loader || state.attempt !== attempt;
  return {
    loading,
    error: loading ? "" : state.error,
    unavailable: !loading && state.unavailable,
    retry,
    data: loading ? undefined : state.data,
    empty: !loading && state.empty,
    status: loading
      ? "loading"
      : state.unavailable
        ? "unavailable"
        : state.error
          ? "error"
          : state.empty
            ? "empty"
            : "success",
  };
}
