import { listProjects } from "@/server/db/project";

import { ProjectForm } from "./project-form";
import { ProjectRow } from "./project-row";

export default async function AdminProjectsPage() {
  const projects = await listProjects();
  const active = projects.filter((p) => p.status === "ACTIVE");
  const archived = projects.filter((p) => p.status === "ARCHIVED");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Every task belongs to a project. Archiving hides one from assignment pickers;
            a project with tasks can be archived but not deleted (docs/prd.md R13–R15).
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-3 text-sm font-semibold">New project</h2>
          <ProjectForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Active ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-muted-foreground text-sm">None yet.</p>
        ) : (
          active.map((p) => <ProjectRow key={p.id} project={p} />)
        )}
      </section>

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Archived ({archived.length})
          </h2>
          {archived.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
