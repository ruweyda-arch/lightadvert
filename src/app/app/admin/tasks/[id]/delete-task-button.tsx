"use client";

import { useRouter } from "next/navigation";

import { ActionButton } from "@/components/action-button";
import { deleteTaskAction } from "@/server/actions/tasks";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();

  return (
    <ActionButton
      run={async () => {
        const res = await deleteTaskAction(taskId);
        if (res.ok) router.push("/app/admin/tasks");
        return res;
      }}
      variant="destructive"
      confirm="Delete this task? This cannot be undone."
    >
      Delete task
    </ActionButton>
  );
}
