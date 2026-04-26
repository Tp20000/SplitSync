// FILE: apps/web/src/components/expenses/ReceiptUpload.tsx
// PURPOSE: Drag-and-drop receipt upload component
// DEPENDS ON: apiClient, shadcn/ui
// LAST UPDATED: F34 - Receipt Image Upload

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileImage,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";
import { getErrorMessage } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ReceiptUploadProps {
  groupId: string;
  expenseId: string;
  currentReceiptUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onDeleteSuccess: () => void;
}

export function ReceiptUpload({
  groupId,
  expenseId,
  currentReceiptUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: ReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      // Client-side validation
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        setError("Only JPG, PNG, WEBP, PDF files are allowed");
        setIsUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB");
        setIsUploading(false);
        return;
      }

      // Show local preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      try {
        const formData = new FormData();
        formData.append("receipt", file);

        const response = await apiClient.post<{
          success: true;
          data: { receiptUrl: string };
        }>(
          `/groups/${groupId}/expenses/${expenseId}/receipt`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        onUploadSuccess(response.data.data.receiptUrl);
        setPreview(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [groupId, expenseId, onUploadSuccess]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.delete(
        `/groups/${groupId}/expenses/${expenseId}/receipt`
      );
      onDeleteSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) void handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
    // Reset input
    e.target.value = "";
  };

  // ── Show existing receipt ──
  if (currentReceiptUrl && !isUploading) {
    const isPdf = currentReceiptUrl.includes(".pdf") ||
      currentReceiptUrl.includes("raw/upload");

    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          {isPdf ? (
            <div className="flex items-center gap-3 p-4">
              <FileText
                size={32}
                className="text-red-500 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Receipt (PDF)</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentReceiptUrl}
                </p>
              </div>
            </div>
          ) : (
            <img
              src={currentReceiptUrl}
              alt="Receipt"
              className="w-full max-h-48 object-cover"
            />
          )}

          {/* Overlay actions */}
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              asChild
            >
              <a
                href={currentReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View full size"
              >
                <Eye size={12} />
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              title="Remove receipt"
            >
              {isDeleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  // ── Upload area ──
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2
              size={28}
              className="animate-spin text-primary"
            />
            <p className="text-sm text-muted-foreground">
              Uploading receipt...
            </p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 rounded object-cover"
            />
            <p className="text-xs text-muted-foreground">
              Uploading...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <FileImage
                size={20}
                className="text-muted-foreground"
              />
              <Upload size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop receipt here or click to upload
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                JPG, PNG, WEBP, PDF — max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}