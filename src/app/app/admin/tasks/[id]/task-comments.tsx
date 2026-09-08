"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatEatDate } from "@/lib/dates";
import { addCommentAction } from "@/server/actions/tasks";

export interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string };
}

export function TaskComments({
  taskId,
  comments,
}: {
  taskId: string;
  comments: CommentItem[];
}) {
  const [state, action, pending] = useActionState(addCommentAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Comments</h2>
      <p className="text-muted-foreground text-xs">
        Append-only. This is where Review feedback goes — there is no rejection status.
      </p>

      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="text-muted-foreground text-xs">
                {c.author.name} · {formatEatDate(c.createdAt)}
              </div>
              <div className="whitespace-pre-wrap">{c.body}</div>
            </li>
          ))}
        </ul>
      )}

      <form ref={ref} action={action} className="space-y-2">
        <input type="hidden" name="taskId" value={taskId} />
        <Textarea name="body" rows={2} required maxLength={4000} placeholder="Add a comment" />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Comment
        </Button>
      </form>
    </section>
  );
}
