"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { Minus, Plus, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cropImage, type PixelCrop } from "@/utils/cropImage";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

type Props = {
  source: string;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
};
const subscribeToMount = () => () => {};

export function AvatarCropModal({ source, onCancel, onConfirm }: Props) {
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const titleId = useId();
  const helpId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mounted) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((item) => item.getClientRects().length > 0);
      const first = items[0],
        last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey, true);
      previousFocus?.focus();
    };
  }, [mounted, onCancel]);

  async function confirm() {
    if (!pixels || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await onConfirm(await cropImage(source, pixels));
    } catch {
      setError(
        text(
          "Could not save this photo. Try another image or retry.",
          "Không thể lưu ảnh này. Hãy thử lại hoặc chọn ảnh khác.",
        ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (!mounted) return null;
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={helpId}
        aria-busy={busy}
        tabIndex={-1}
        className="avatar-crop-dialog w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#191714] text-white shadow-2xl outline-none"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
      >
        <div className="flex items-center justify-between gap-4 p-5">
          <h2
            id={titleId}
            style={{
              fontSize: 20,
              lineHeight: 1.35,
              margin: 0,
              letterSpacing: "normal",
            }}
            className="text-lg font-bold text-[#ffc775]"
          >
            {text("Adjust profile photo", "Chỉnh ảnh hồ sơ")}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label={text("Close crop editor", "Đóng trình chỉnh ảnh")}
            className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ffa333] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        <p id={helpId} className="px-5 pb-4 text-sm text-zinc-400">
          {text(
            "Drag to position your photo. Use arrow keys to move and the slider to zoom.",
            "Kéo ảnh để chỉnh vị trí. Dùng phím mũi tên để di chuyển và thanh trượt để phóng to.",
          )}
        </p>
        <div
          className="relative w-full bg-black"
          style={{ height: "clamp(240px, 44dvh, 360px)", touchAction: "none" }}
        >
          <Cropper
            cropperProps={{
              tabIndex: 0,
              role: "group",
              "aria-label": text("Photo position", "Vị trí ảnh"),
            }}
            keyboardStep={10}
            image={source}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={3}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropAreaChange={(_area, areaPixels) => setPixels(areaPixels)}
            onMediaLoaded={() => {
              setError("");
              setMediaError(false);
            }}
            mediaProps={{
              onError: () => {
                setMediaError(true);
                setError(
                  text(
                    "This image could not be opened. Choose another photo.",
                    "Không thể mở ảnh này. Vui lòng chọn ảnh khác.",
                  ),
                );
              },
            }}
          />
          {busy && <div className="absolute inset-0 z-10 bg-black/30" />}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={text("Zoom out", "Thu nhỏ")}
              disabled={busy || zoom <= 1}
              onClick={() =>
                setZoom((value) =>
                  Math.max(1, Math.round((value - 0.05) * 100) / 100),
                )
              }
              className="rounded-lg border border-white/15 p-2 hover:bg-white/10 disabled:opacity-40"
            >
              <Minus size={18} />
            </button>
            <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs text-zinc-400">
              {text("Zoom", "Phóng to")} · {zoom.toFixed(2)}×
              <input
                aria-label={text("Photo zoom", "Độ phóng to ảnh")}
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={busy}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#ffa333]"
              />
            </label>
            <button
              type="button"
              aria-label={text("Zoom in", "Phóng to")}
              disabled={busy || zoom >= 3}
              onClick={() =>
                setZoom((value) =>
                  Math.min(3, Math.round((value + 0.05) * 100) / 100),
                )
              }
              className="rounded-lg border border-white/15 p-2 hover:bg-white/10 disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {text("Cancel", "Hủy")}
            </button>
            <button
              type="button"
              onClick={() => {
                void confirm();
              }}
              disabled={busy || !pixels || mediaError}
              className="rounded-lg bg-gradient-to-r from-[#ffcd75] to-[#ffa333] px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {busy
                ? text("Saving…", "Đang lưu…")
                : text("Save photo", "Lưu ảnh")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
