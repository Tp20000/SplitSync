// FILE: apps/server/src/shared/types/express.d.ts
// PURPOSE: Extends Express Request to include authenticated user payload
// DEPENDS ON: express
// LAST UPDATED: F04 - Express Server Base

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }
}