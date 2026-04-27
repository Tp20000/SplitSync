// FILE: apps/server/src/modules/expenses/upload.controller.ts
// PURPOSE: Handles receipt file upload endpoint
// DEPENDS ON: multer, cloudinary utils, prisma
// LAST UPDATED: F34 - Receipt Image Upload

import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadReceipt } from "../../shared/utils/cloudinary";
import prisma from "../../config/database";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";

// ─────────────────────────────────────────────
// Multer config — memory storage (no disk writes)
// ─────────────────────────────────────────────

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
    fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, PNG, WEBP, PDF allowed."
        )
      );
    }
  },
});

// ─────────────────────────────────────────────
// POST /api/v1/groups/:id/expenses/:eid/receipt
// ─────────────────────────────────────────────

export async function uploadExpenseReceipt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const { id: groupId, eid: expenseId } = req.params;

    // Verify membership
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: req.user.id },
      },
      select: { id: true },
    });

    if (!member) {
      throw ApiError.forbidden(
        "You are not a member of this group",
        ErrorCode.NOT_GROUP_MEMBER
      );
    }

    // Verify expense exists
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId, isDeleted: false },
      select: { id: true },
    });

    if (!expense) {
      throw ApiError.notFound("Expense");
    }

    // Check file was uploaded
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest(
        "No file provided",
        ErrorCode.INVALID_INPUT
      );
    }

    // Upload to Cloudinary
    const result = await uploadReceipt(
      file.buffer,
      file.mimetype,
      file.originalname,
      expenseId
    );

    // Save URL to expense
    await prisma.expense.update({
      where: { id: expenseId },
      data: { receiptUrl: result.url },
    });

    sendSuccess(res, {
      receiptUrl: result.url,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/v1/groups/:id/expenses/:eid/receipt
// ─────────────────────────────────────────────

export async function deleteExpenseReceipt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const { id: groupId, eid: expenseId } = req.params;

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId, isDeleted: false },
      select: { id: true, receiptUrl: true },
    });

    if (!expense) {
      throw ApiError.notFound("Expense");
    }

    if (expense.receiptUrl) {
      // Extract public ID from Cloudinary URL
      const urlParts = expense.receiptUrl.split("/");
      const publicId = urlParts
        .slice(urlParts.indexOf("splitsync"))
        .join("/")
        .replace(/\.[^/.]+$/, ""); // Remove extension

      const { deleteReceipt } = await import(
        "../../shared/utils/cloudinary"
      );
      await deleteReceipt(publicId);
    }

    await prisma.expense.update({
      where: { id: expenseId },
      data: { receiptUrl: null },
    });

    sendSuccess(res, { message: "Receipt deleted" });
  } catch (err) {
    next(err);
  }
}