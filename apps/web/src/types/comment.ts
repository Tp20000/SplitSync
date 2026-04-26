// FILE: apps/web/src/types/comment.ts
// PURPOSE: TypeScript types for comments
// DEPENDS ON: none
// LAST UPDATED: F28 - Comments on Expenses

export interface Comment {
  id: string;
  expenseId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}