// FILE: apps/server/src/shared/utils/cloudinary.ts
// PURPOSE: Cloudinary upload + delete utilities
// DEPENDS ON: cloudinary SDK (installed via npm), sharp, env
// LAST UPDATED: F34 - Receipt Image Upload

import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { env } from "../../config/env";
import { logger } from "./logger";
import { ApiError, ErrorCode } from "./ApiError";

// ─────────────────────────────────────────────
// Configure Cloudinary
// ─────────────────────────────────────────────

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────
// Upload config
// ─────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const UPLOAD_FOLDER = "splitsync/receipts";

// ─────────────────────────────────────────────
// Check if Cloudinary is configured
// ─────────────────────────────────────────────

export function isCloudinaryConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

// ─────────────────────────────────────────────
// Optimize image with Sharp before uploading
// ─────────────────────────────────────────────

async function optimizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  // Don't optimize PDFs
  if (mimeType === "application/pdf") {
    return buffer;
  }

  try {
    const optimized = await sharp(buffer)
      .resize({
        width: 1200,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    logger.debug(
      `[Cloudinary] Image optimized: ${buffer.length} → ${optimized.length} bytes`
    );

    return optimized;
  } catch (err) {
    const error = err as Error;
    logger.warn("[Cloudinary] Image optimization failed:", {
      message: error.message,
    });
    return buffer; // Return original if optimization fails
  }
}

// ─────────────────────────────────────────────
// Upload receipt to Cloudinary
// ─────────────────────────────────────────────

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export async function uploadReceipt(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  expenseId: string
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw ApiError.badRequest(
      `File type not supported. Allowed: JPG, PNG, WEBP, PDF`,
      ErrorCode.INVALID_INPUT
    );
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw ApiError.badRequest(
      `File too large. Maximum size is 5MB`,
      ErrorCode.INVALID_INPUT
    );
  }

  // Check Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw ApiError.badRequest(
      "Receipt upload is not configured",
      ErrorCode.SERVICE_UNAVAILABLE
    );
  }

  // Optimize image (skip for PDF)
  const optimizedBuffer = await optimizeImage(buffer, mimeType);

  // Upload to Cloudinary
  const publicId = `${UPLOAD_FOLDER}/${expenseId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        folder: UPLOAD_FOLDER,
        resource_type: mimeType === "application/pdf" ? "raw" : "image",
        transformation:
          mimeType !== "application/pdf"
            ? [{ quality: "auto", fetch_format: "auto" }]
            : undefined,
        tags: ["receipt", "splitsync", expenseId],
      },
      (error, result) => {
        if (error || !result) {
          logger.error("[Cloudinary] Upload failed:", {
            message: error?.message,
          });
          reject(
            ApiError.internal(
              "Failed to upload receipt. Please try again."
            )
          );
          return;
        }

        logger.info(
          `[Cloudinary] Uploaded: ${result.public_id} (${result.bytes} bytes)`
        );

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(optimizedBuffer);
  });
}

// ─────────────────────────────────────────────
// Delete receipt from Cloudinary
// ─────────────────────────────────────────────

export async function deleteReceipt(
  publicId: string
): Promise<void> {
  if (!isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`[Cloudinary] Deleted: ${publicId}`);
  } catch (err) {
    const error = err as Error;
    logger.warn("[Cloudinary] Delete failed:", {
      message: error.message,
    });
  }
}

// ─────────────────────────────────────────────
// Generate thumbnail URL
// ─────────────────────────────────────────────

export function getThumbnailUrl(
  url: string,
  width = 200,
  height = 200
): string {
  if (!url || !url.includes("cloudinary.com")) return url;

  // Insert transformation into Cloudinary URL
  return url.replace(
    "/upload/",
    `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`
  );
}