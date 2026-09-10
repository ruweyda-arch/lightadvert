"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction, updateProjectAction } from "@/server/actions/projects";
import { PROJECT_PRIORITIES } from "@/server/validation/project";

export interface ProjectFormValue {
  id: string;
  name: string;
  deadline: string;
  priority: string;
  clientLabel: string;
  brief: string;
}

const titleCase = (s: string) => s[0] + s.slice(1).toLowerCase();

export function ProjectForm({
  project,
  onDone,
}: {
  project?: ProjectFormValue;
  onDone?: () => void;
}) {
  const isEdit = Boolean(project);
  const [state, action, pending] = useActionState(
    isEdit ? updateProjectAction : createProjectAction,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Project updated." : "Project created.");
      if (!isEdit) ref.current?.reset();
      onDone?.();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, isEdit, onDone]);

  return (
    <form ref={ref} action={action} className="max-w-md space-y-3">
      {isEdit ? <input type="hidden" name="id" value={project!.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="pf-name">Name</Label>
        <Input id="pf-name" name="name" defaultValue={project?.name} required maxLength={120} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pf-deadline">Deadline</Label>
          <Input
            id="pf-deadline"
            name="deadline"
            type="date"
            defaultValue={project?.deadline}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-priority">Priority</Label>
          <NativeSelect
            id="pf-priority"
            name="priority"
            defaultValue={project?.priority ?? "NORMAL"}
          >
            {PROJECT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {titleCase(p)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-client">Client (optional)</Label>
        <Input
          id="pf-client"
          name="clientLabel"
          defaultValue={project?.clientLabel}
          maxLength={120}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-brief">Brief (optional)</Label>
        <Textarea
          id="pf-brief"
          name="brief"
          defaultValue={project?.brief}
          maxLength={2000}
          rows={3}
        />
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create project"}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
