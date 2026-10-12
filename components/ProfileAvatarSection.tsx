"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { cropPreviewUrl } from "@/utils/cropImage";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

type Props = {
  avatar?: string | null;
  name: string;
  disabled?: boolean;
  hasCustomPhoto?: boolean;
  onSave: (file: File | null) => Promise<void>;
};
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function ProfileAvatarSection({
  avatar,
  name,
  disabled = false,
  hasCustomPhoto = false,
  onSave,
}: Props) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const input = useRef<HTMLInputElement>(null);
  const rawUrl = useRef<string | null>(null);
  const previewUrl = useRef<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const cancel = useCallback(() => {
    if (rawUrl.current) URL.revokeObjectURL(rawUrl.current);
    rawUrl.current = null;
    setSource(null);
    if (input.current) input.current.value = "";
  }, []);
  useEffect(
    () => () => {
      if (rawUrl.current) URL.revokeObjectURL(rawUrl.current);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    if (!file || disabled || saving) return;
    if (!allowedTypes.has(file.type)) {
      setError(
        text(
          "Choose a PNG, JPG or WebP image.",
          "Vui lòng chọn ảnh PNG, JPG hoặc WebP.",
        ),
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(
        text(
          "Photo exceeds 5 MB. Choose a smaller image.",
          "Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.",
        ),
      );
      return;
    }
    if (rawUrl.current) URL.revokeObjectURL(rawUrl.current);
    rawUrl.current = URL.createObjectURL(file);
    setSource(rawUrl.current);
  }

  async function confirm(file: File) {
    setSaving(true);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = cropPreviewUrl(file);
    setPreview(previewUrl.current);
    try {
      await onSave(file);
      cancel();
    } finally {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
      setPreview(null);
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError("");
    try {
      await onSave(null);
    } catch {
      setError(
        text(
          "Could not remove photo. Please retry.",
          "Không thể xóa ảnh. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="coach-avatar-upload-row">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled || saving}
          aria-label={text("Change profile photo", "Thay ảnh hồ sơ")}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffa333] disabled:opacity-50"
        >
          {preview || avatar ? (
            <Image
              className="coach-avatar-preview"
              src={preview || avatar!}
              alt={name}
              width={72}
              height={72}
              unoptimized
            />
          ) : (
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ffa333] text-2xl font-bold text-black">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>
        <div className="coach-avatar-actions">
          <button
            type="button"
            className="coach-btn-secondary"
            onClick={() => input.current?.click()}
            disabled={disabled || saving}
          >
            {text("Upload photo", "Tải ảnh lên")}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={select}
            disabled={disabled || saving}
            className="hidden"
          />
          {hasCustomPhoto && (
            <button
              type="button"
              className="coach-btn-secondary"
              onClick={() => {
                void remove();
              }}
              disabled={disabled || saving}
            >
              {text("Remove custom photo", "Xóa ảnh tùy chỉnh")}
            </button>
          )}
          <small>
            {text(
              "PNG, JPG or WebP · Max 5 MB",
              "PNG, JPG hoặc WebP · Tối đa 5 MB",
            )}
          </small>
          <small>
            {text(
              "Crop and confirm before saving your photo.",
              "Cắt và xác nhận trước khi lưu ảnh.",
            )}
          </small>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <AnimatePresence>
        {source && (
          <AvatarCropModal
            key={source}
            source={source}
            onCancel={cancel}
            onConfirm={confirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
