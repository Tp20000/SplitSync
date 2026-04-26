// FILE: apps/web/src/components/expenses/CommentSection.tsx
// PURPOSE: Comment thread on an expense — list + compose
// DEPENDS ON: useComments, useCreateComment, useRealtimeComments
// LAST UPDATED: F28 - Comments on Expenses

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useComments,
  useCreateComment,
  useRealtimeComments,
} from "@/hooks/useComments";
import { useUser } from "@/stores/authStore";
import {
  formatRelativeTime,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  groupId: string;
  expenseId: string;
}

export function CommentSection({
  groupId,
  expenseId,
}: CommentSectionProps) {
  const currentUser = useUser();
  const { data: comments, isLoading } = useComments(
    groupId,
    expenseId
  );
  const { mutate: createComment, isPending } = useCreateComment(
    groupId,
    expenseId
  );
  const [newComment, setNewComment] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for real-time comments
  useRealtimeComments(groupId, expenseId);

  // Auto-scroll on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments?.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || isPending) return;

    createComment(trimmed, {
      onSuccess: () => setNewComment(""),
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-muted-foreground" />
        <h4 className="text-sm font-semibold">
          Comments
          {comments && comments.length > 0 && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h4>
      </div>

      {/* Comment list */}
      <div
        ref={scrollRef}
        className="max-h-60 overflow-y-auto space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !comments || comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.userId === currentUser?.id;

            return (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-2.5",
                  isOwn && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: stringToColor(
                      comment.user.name
                    ),
                  }}
                >
                  {getInitials(comment.user.name)}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-xl px-3 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  {!isOwn && (
                    <p className="text-[10px] font-semibold mb-0.5">
                      {comment.user.name.split(" ")[0]}
                    </p>
                  )}
                  <p className="text-sm break-words">
                    {comment.content}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-0.5",
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatRelativeTime(comment.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Add a comment..."
          className="h-9 text-sm"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
          disabled={isPending}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!newComment.trim() || isPending}
        >
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}