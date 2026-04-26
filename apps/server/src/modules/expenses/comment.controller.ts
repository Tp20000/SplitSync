// FILE: apps/server/src/modules/expenses/comment.controller.ts
// PURPOSE: Express handlers for comment endpoints
// DEPENDS ON: comment.service, ApiResponse
// LAST UPDATED: F28 - Comments on Expenses

import { Request, Response, NextFunction } from "express";
import * as CommentService from "./comment.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";
import type { CreateCommentInput } from "./comment.validation";

// POST /api/v1/groups/:id/expenses/:eid/comments
export async function createComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const comment = await CommentService.createComment(
      req.params.id,
      req.params.eid,
      req.user.id,
      req.body as CreateCommentInput
    );

    sendSuccess(res, { comment }, 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/expenses/:eid/comments
export async function listComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const comments = await CommentService.listComments(
      req.params.id,
      req.params.eid,
      req.user.id
    );

    sendSuccess(res, { comments });
  } catch (err) {
    next(err);
  }
}