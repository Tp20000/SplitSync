// FILE: apps/server/src/modules/groups/group.controller.ts
// PURPOSE: Express route handlers for group endpoints
// DEPENDS ON: group.service, ApiResponse, express
// LAST UPDATED: F10 - Groups CRUD API

import { Request, Response, NextFunction } from "express";
import * as GroupService from "./group.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from "./group.validation";

// ─────────────────────────────────────────────
// POST /api/v1/groups
// ─────────────────────────────────────────────

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const group = await GroupService.createGroup(
      req.user.id,
      req.body as CreateGroupInput
    );
    sendSuccess(res, { group }, 201);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups
// ─────────────────────────────────────────────

export async function getGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const groups = await GroupService.getUserGroups(req.user.id);
    sendSuccess(res, { groups });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id
// ─────────────────────────────────────────────

export async function getGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const group = await GroupService.getGroupById(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, { group });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/v1/groups/:id
// ─────────────────────────────────────────────

export async function updateGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const group = await GroupService.updateGroup(
      req.params.id,
      req.user.id,
      req.body as UpdateGroupInput
    );
    sendSuccess(res, { group });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/v1/groups/:id
// ─────────────────────────────────────────────

export async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    await GroupService.archiveGroup(req.params.id, req.user.id);
    sendSuccess(res, { message: "Group archived successfully" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/groups/join
// ─────────────────────────────────────────────

export async function joinGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const result = await GroupService.joinGroup(
      req.user.id,
      (req.body as { inviteCode: string }).inviteCode
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/groups/:id/leave
// ─────────────────────────────────────────────

export async function leaveGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    await GroupService.leaveGroup(req.params.id, req.user.id);
    sendSuccess(res, { message: "Left group successfully" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/members
// ─────────────────────────────────────────────

export async function getMembers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const members = await GroupService.getGroupMembers(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, { members });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/balances
// ─────────────────────────────────────────────

export async function getBalances(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const balances = await GroupService.getGroupBalances(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, balances);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/settle-suggestions
// ─────────────────────────────────────────────

export async function getSettleSuggestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const suggestions = await GroupService.getSettleSuggestions(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, suggestions);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/v1/groups/:id/members/:userId/role
// ─────────────────────────────────────────────

export async function updateMemberRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const member = await GroupService.updateMemberRole(
      req.params.id,
      req.user.id,
      req.params.userId,
      (req.body as { role: "admin" | "member" }).role
    );

    sendSuccess(res, { member });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/v1/groups/:id/members/:userId
// ─────────────────────────────────────────────

export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await GroupService.removeMember(
      req.params.id,
      req.user.id,
      req.params.userId
    );

    sendSuccess(res, { message: "Member removed successfully" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/groups/:id/invite/regenerate
// ─────────────────────────────────────────────

export async function regenerateInviteCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await GroupService.regenerateInviteCode(
      req.params.id,
      req.user.id
    );

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}