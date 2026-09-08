import { prisma } from "./client";

export function listProjects() {
  return prisma.project.findMany({
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { name: "asc" }],
    include: { _count: { select: { tasks: true } } },
  });
}

export type ProjectWithCount = Awaited<ReturnType<typeof listProjects>>[number];

export function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });
}
