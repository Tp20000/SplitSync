// FILE: apps/web/src/components/groups/ExportPdfButton.tsx
// PURPOSE: Button to trigger PDF report download
// DEPENDS ON: apiClient, shadcn/ui
// LAST UPDATED: F36 - PDF Export

"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/axios";

interface ExportPdfButtonProps {
  groupId: string;
  groupName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ExportPdfButton({
  groupId,
  groupName,
  variant = "outline",
  size = "sm",
}: ExportPdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = async () => {
    setIsDownloading(true);

    try {
      const token = getAccessToken();
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:5000/api/v1";

      // Fetch PDF as blob
      const response = await fetch(
        `${apiUrl}/groups/${groupId}/analytics/export/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `splitsync-${groupName
        .replace(/\s+/g, "-")
        .toLowerCase()}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ExportPdf] Failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className="gap-2"
      onClick={() => void handleExport()}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileDown size={14} />
      )}
      {isDownloading ? "Generating..." : "Export PDF"}
    </Button>
  );
}