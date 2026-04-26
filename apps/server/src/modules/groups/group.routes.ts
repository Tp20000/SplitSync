// FILE: apps/server/src/modules/groups/group.routes.ts
// PURPOSE: Group route definitions with auth + validation middleware
// DEPENDS ON: express, group.controller, auth.middleware, validate.middleware
// LAST UPDATED: F10 - Groups CRUD API

import { Router } from "express";
import * as GroupController from "./group.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  createGroupSchema,
  updateGroupSchema,
  joinGroupSchema,
  groupIdParamSchema,
} from "./group.validation";

const router = Router();

// ─────────────────────────────────────────────
// All group routes require authentication
// ─────────────────────────────────────────────

router.use(authenticate);

// ─────────────────────────────────────────────
// Collection routes
// ─────────────────────────────────────────────

// POST /api/v1/groups — create group
router.post(
  "/",
  validate(createGroupSchema),
  GroupController.createGroup
);

// GET /api/v1/groups — list user's groups
router.get("/", GroupController.getGroups);

// POST /api/v1/groups/join — join via invite code
// Must be before /:id routes to avoid conflict
router.post(
  "/join",
  validate(joinGroupSchema),
  GroupController.joinGroup
);

// ─────────────────────────────────────────────
// Single group routes
// ─────────────────────────────────────────────

// GET /api/v1/groups/:id
router.get(
  "/:id",
  validate(groupIdParamSchema),
  GroupController.getGroup
);

// PATCH /api/v1/groups/:id
router.patch(
  "/:id",
  validate(updateGroupSchema),
  GroupController.updateGroup
);

// DELETE /api/v1/groups/:id
router.delete(
  "/:id",
  validate(groupIdParamSchema),
  GroupController.deleteGroup
);

// POST /api/v1/groups/:id/leave
router.post(
  "/:id/leave",
  validate(groupIdParamSchema),
  GroupController.leaveGroup
);

// ─────────────────────────────────────────────
// Group sub-routes
// ─────────────────────────────────────────────

// GET /api/v1/groups/:id/members
router.get(
  "/:id/members",
  validate(groupIdParamSchema),
  GroupController.getMembers
);

// GET /api/v1/groups/:id/balances
router.get(
  "/:id/balances",
  validate(groupIdParamSchema),
  GroupController.getBalances
);

// GET /api/v1/groups/:id/settle-suggestions
router.get(
  "/:id/settle-suggestions",
  validate(groupIdParamSchema),
  GroupController.getSettleSuggestions
);

// ─────────────────────────────────────────────
// Member management routes
// ─────────────────────────────────────────────

// PATCH /api/v1/groups/:id/members/:userId/role
router.patch(
  "/:id/members/:userId/role",
  GroupController.updateMemberRole
);

// DELETE /api/v1/groups/:id/members/:userId
router.delete(
  "/:id/members/:userId",
  GroupController.removeMember
);

// POST /api/v1/groups/:id/invite/regenerate
router.post(
  "/:id/invite/regenerate",
  GroupController.regenerateInviteCode
);

export default router;