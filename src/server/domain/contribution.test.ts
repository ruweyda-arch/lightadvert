import { describe, expect, it } from "vitest";

import {
  contributionCsv,
  summariseContribution,
  type ApprovedTaskRow,
  type RosterEntry,
} from "./contribution";

const roster: RosterEntry[] = [
  { userId: "u-ann", name: "Ann" },
  { userId: "u-ben", name: "Ben" },
  { userId: "u-cara", name: "Cara" },
];

function row(over: Partial<ApprovedTaskRow>): ApprovedTaskRow {
  return {
    taskId: "t",
    assigneeId: "u-ann",
    assigneeName: "Ann",
    stampedRoleId: "r-edit",
    stampedRoleName: "Video Editor",
    projectName: "P",
    taskTitle: "T",
    effortPoints: 3,
    approvalDate: new Date("2026-01-15T09:00:00Z"),
    ...over,
  };
}

describe("summariseContribution", () => {
  it("lists roster members with zero approved tasks as 0 (R37)", () => {
    const { people } = summariseContribution([], roster);
    expect(people.map((p) => [p.name, p.total])).toEqual([
      ["Ann", 0],
      ["Ben", 0],
      ["Cara", 0],
    ]);
  });

  it("sorts by total desc then name, with no ranking field (ADR-0002)", () => {
    const { people } = summariseContribution(
      [
        row({ assigneeId: "u-ben", assigneeName: "Ben", effortPoints: 8 }),
        row({ assigneeId: "u-ann", assigneeName: "Ann", effortPoints: 5 }),
        row({ assigneeId: "u-cara", assigneeName: "Cara", effortPoints: 5 }),
      ],
      roster,
    );
    expect(people.map((p) => p.name)).toEqual(["Ben", "Ann", "Cara"]);
    expect(people[0]).not.toHaveProperty("rank");
  });

  it("splits a multi-Role person across per-Role subtotals but counts them once company-wide (R38)", () => {
    const { people, companyTotal, byRole } = summariseContribution(
      [
        row({ effortPoints: 5, stampedRoleId: "r-edit", stampedRoleName: "Video Editor" }),
        row({ effortPoints: 2, stampedRoleId: "r-cc", stampedRoleName: "Content Creator" }),
      ],
      roster,
    );
    const ann = people.find((p) => p.name === "Ann")!;
    expect(ann.total).toBe(7);
    expect(ann.byRole).toEqual([
      { roleId: "r-edit", roleName: "Video Editor", points: 5 },
      { roleId: "r-cc", roleName: "Content Creator", points: 2 },
    ]);
    expect(companyTotal).toBe(7);
    expect(byRole).toEqual([
      { roleId: "r-edit", roleName: "Video Editor", points: 5 },
      { roleId: "r-cc", roleName: "Content Creator", points: 2 },
    ]);
  });

  it("includes an off-roster assignee that still has approved history (A8)", () => {
    const { people } = summariseContribution(
      [row({ assigneeId: "u-gone", assigneeName: "Dex (left)", effortPoints: 13 })],
      roster,
    );
    expect(people[0]).toMatchObject({ name: "Dex (left)", total: 13 });
    expect(people).toHaveLength(4);
  });
});

describe("acceptance criteria", () => {
  it("A6 — attribution follows the Task's stamped Role, not the person", () => {
    // Ann's profile is Content Creator, but this Task is stamped Video Editor.
    const { people, byRole } = summariseContribution(
      [
        row({
          assigneeId: "u-ann",
          assigneeName: "Ann",
          stampedRoleId: "r-edit",
          stampedRoleName: "Video Editor",
          effortPoints: 8,
        }),
      ],
      roster,
    );
    const ann = people.find((p) => p.name === "Ann")!;
    expect(ann.byRole).toEqual([
      { roleId: "r-edit", roleName: "Video Editor", points: 8 },
    ]);
    expect(byRole).toEqual([
      { roleId: "r-edit", roleName: "Video Editor", points: 8 },
    ]);
  });

  it("A7 — CSV per-person and grand totals reconcile with the summary", () => {
    const rows = [
      row({ assigneeId: "u-ann", assigneeName: "Ann", effortPoints: 5 }),
      row({ assigneeId: "u-ann", assigneeName: "Ann", effortPoints: 3 }),
      row({ assigneeId: "u-ben", assigneeName: "Ben", effortPoints: 8 }),
    ];
    const summary = summariseContribution(rows, roster);
    const csv = contributionCsv(rows, roster).split("\n");

    const totalLine = (name: string) =>
      csv.find((l) => l.startsWith(`${name},`) && l.endsWith(",TOTAL"))!;

    expect(totalLine("Ann")).toBe("Ann,,,,8,TOTAL");
    expect(totalLine("Ben")).toBe("Ben,,,,8,TOTAL");
    expect(csv.find((l) => l.endsWith(",GRAND TOTAL"))).toBe(
      `Company,,,,${summary.companyTotal},GRAND TOTAL`,
    );
    expect(summary.companyTotal).toBe(16);
    // header + one data row per approved task + 3 person totals + grand total
    expect(csv.filter((l) => l.length > 0)).toHaveLength(1 + rows.length + 3 + 1);
  });
});
