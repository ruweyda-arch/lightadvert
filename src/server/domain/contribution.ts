/**
 * Contribution summary (docs/prd.md R29, R36–R39; ADR-0001, ADR-0002).
 *
 * Pure aggregation over the approved-Task rows the caller has already filtered to
 * a date range (and optionally a stamped Role). No ranking — just totals, sorted.
 */

export interface ApprovedTaskRow {
  taskId: string;
  assigneeId: string;
  assigneeName: string;
  stampedRoleId: string;
  stampedRoleName: string;
  projectName: string;
  taskTitle: string;
  effortPoints: number;
  approvalDate: Date;
}

export interface RosterEntry {
  userId: string;
  name: string;
}

export interface RoleSubtotal {
  roleId: string;
  roleName: string;
  points: number;
}

export interface PersonContribution {
  userId: string;
  name: string;
  total: number;
  taskCount: number;
  byRole: RoleSubtotal[];
}

export interface ContributionSummary {
  /** Every roster member (plus any off-roster assignee with history), total desc then name. */
  people: PersonContribution[];
  /** Each person counted once. */
  companyTotal: number;
  /** Company-wide totals per stamped Role. */
  byRole: RoleSubtotal[];
}

export function summariseContribution(
  rows: readonly ApprovedTaskRow[],
  roster: readonly RosterEntry[],
): ContributionSummary {
  const people = new Map<string, PersonContribution>();
  for (const member of roster) {
    people.set(member.userId, {
      userId: member.userId,
      name: member.name,
      total: 0,
      taskCount: 0,
      byRole: [],
    });
  }

  const companyByRole = new Map<string, RoleSubtotal>();

  for (const row of rows) {
    let person = people.get(row.assigneeId);
    if (!person) {
      // e.g. a deactivated Staff Member with approved history (docs/prd.md A8).
      person = {
        userId: row.assigneeId,
        name: row.assigneeName,
        total: 0,
        taskCount: 0,
        byRole: [],
      };
      people.set(row.assigneeId, person);
    }

    person.total += row.effortPoints;
    person.taskCount += 1;

    let personRole = person.byRole.find((r) => r.roleId === row.stampedRoleId);
    if (!personRole) {
      personRole = { roleId: row.stampedRoleId, roleName: row.stampedRoleName, points: 0 };
      person.byRole.push(personRole);
    }
    personRole.points += row.effortPoints;

    let companyRole = companyByRole.get(row.stampedRoleId);
    if (!companyRole) {
      companyRole = { roleId: row.stampedRoleId, roleName: row.stampedRoleName, points: 0 };
      companyByRole.set(row.stampedRoleId, companyRole);
    }
    companyRole.points += row.effortPoints;
  }

  const sortedPeople = [...people.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name),
  );
  for (const person of sortedPeople) {
    person.byRole.sort((a, b) => b.points - a.points || a.roleName.localeCompare(b.roleName));
  }

  return {
    people: sortedPeople,
    companyTotal: sortedPeople.reduce((sum, p) => sum + p.total, 0),
    byRole: [...companyByRole.values()].sort(
      (a, b) => b.points - a.points || a.roleName.localeCompare(b.roleName),
    ),
  };
}

/** CSV rows for the payroll export (docs/prd.md R39). */
export function contributionCsv(
  rows: readonly ApprovedTaskRow[],
  roster: readonly RosterEntry[],
): string {
  const summary = summariseContribution(rows, roster);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines: string[] = [
    ["Staff", "Stamped Role", "Task", "Project", "Points", "Approval Date"].join(","),
  ];

  for (const row of [...rows].sort(
    (a, b) => a.assigneeName.localeCompare(b.assigneeName) || +a.approvalDate - +b.approvalDate,
  )) {
    lines.push(
      [
        row.assigneeName,
        row.stampedRoleName,
        row.taskTitle,
        row.projectName,
        row.effortPoints,
        row.approvalDate.toISOString().slice(0, 10),
      ]
        .map(escape)
        .join(","),
    );
  }

  lines.push("");
  for (const person of summary.people) {
    lines.push([escape(person.name), "", "", "", person.total, "TOTAL"].join(","));
  }
  lines.push(["Company", "", "", "", summary.companyTotal, "GRAND TOTAL"].join(","));

  return lines.join("\n");
}
