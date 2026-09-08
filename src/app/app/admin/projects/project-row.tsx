"use client";

import { useState } from "react";

import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEatDate } from "@/lib/dates";
import { deleteProjectAction, setProjectStatusAction } from "@/server/actions/projects";
import type { ProjectWithCount } from "@/server/db/project";

import { ProjectForm } from "./project-form";

export function ProjectRow({ project }: { project: ProjectWithCount }) {
  const [editing, setEditing] = useState(false);
  const archived = project.status === "ARCHIVED";
  const tasks = project._count.tasks;

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-48">
          <div className="font-medium">
            {project.name}
            {project.isSeed ? " · seed" : ""}
          </div>
          <div className="text-muted-foreground text-xs">
            Due {formatEatDate(project.deadline)}
            {project.clientLabel ? ` · ${project.clientLabel}` : ""}
          </div>
        </div>

        <Badge variant="outline">{project.priority}</Badge>
        <Badge variant={archived ? "secondary" : "default"}>{project.status}</Badge>
        <span className="text-muted-foreground text-sm">
          {tasks} task{tasks === 1 ? "" : "s"}
        </span>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
          <ActionButton
            run={() =>
              setProjectStatusAction(project.id, archived ? "ACTIVE" : "ARCHIVED")
            }
            successMessage="Status updated."
            disabled={project.isSeed}
          >
            {archived ? "Unarchive" : "Archive"}
          </ActionButton>
          <ActionButton
            run={() => deleteProjectAction(project.id)}
            variant="destructive"
            confirm={`Delete "${project.name}"?`}
            successMessage="Project deleted."
            disabled={project.isSeed || tasks > 0}
          >
            Delete
          </ActionButton>
        </div>
      </div>

      {project.brief ? (
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{project.brief}</p>
      ) : null}

      {editing ? (
        <div className="bg-muted/30 rounded-md p-4">
          <ProjectForm
            project={{
              id: project.id,
              name: project.name,
              deadline: project.deadline.toISOString().slice(0, 10),
              priority: project.priority,
              clientLabel: project.clientLabel ?? "",
              brief: project.brief ?? "",
            }}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
