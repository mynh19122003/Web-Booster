export type PixelCrop = { x: number; y: number; width: number; height: number };

export async function cropImage(
  source: string,
  crop: PixelCrop,
): Promise<File> {
  if (
    ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
    crop.width <= 0 ||
    crop.height <= 0 ||
    crop.x < 0 ||
    crop.y < 0
  ) {
    throw new Error("Invalid crop coordinates");
  }
  const image = new Image();
  image.src = source;
  await image.decode();
  if (
    crop.x + crop.width > image.naturalWidth + 1 ||
    crop.y + crop.height > image.naturalHeight + 1
  )
    throw new Error("Crop exceeds image bounds");
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 512 / Math.max(crop.width, crop.height));
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    Math.min(crop.width, image.naturalWidth - crop.x),
    Math.min(crop.height, image.naturalHeight - crop.y),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("Image export failed")),
      "image/jpeg",
      0.92,
    ),
  );
  return new File([blob], "avatar.jpg", {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/** The caller owns this URL and must revoke it when replaced or unmounted. */
export function cropPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}
