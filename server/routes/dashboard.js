import { Router } from 'express';
import { sql } from '../db.js';
import { CASE_TABLES } from '../config/caseTable.js';
import { requireAuth } from '../requireauth.js';

// Dashboard endpoints.
//
//   GET /api/dashboard/user   the signed-in person's own files (an admin gets their own too)
//   GET /api/dashboard/admin  the whole firm; administrators only
//
// Both read every table listed in CASE_TABLES, so a new case type shows up here as
// soon as it is added to caseTable.js. Nothing here needs a new column or table.

const router = Router();

const RECENT_LIMIT = 8; // files shown under "Recently opened"
const YEAR_WINDOW = 6; // years shown in the by-year chart
const TOP_ADVOCATES = 10; // rows shown in the workload chart

async function isAdmin(userId) {
  const rows = await sql`
    SELECT 1 FROM neon_auth."user"
    WHERE id::text = ${String(userId)} AND 'admin' = ANY(string_to_array(role, ','))
    LIMIT 1
  `;
  return rows.length > 0;
}

function initialsFrom(name) {
  if (!name) return null;
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0]?.toUpperCase())
      .join('') || null
  );
}

// One row per file from every case table, reduced to the columns the dashboard
// needs. fileType and table/column names come from caseTable.js (not from the
// request), so building SQL text from them is safe; the user id is always $1.
function filesUnion({ onlyOwn }) {
  return Object.entries(CASE_TABLES)
    .map(([fileType, cfg]) => {
      const col = (name) => cfg.columns[name] ?? 'NULL';
      let where = '';
      if (onlyOwn) {
        where = cfg.columns.advocateId
          ? `WHERE ${cfg.columns.advocateId}::text = $1`
          : 'WHERE FALSE';
      }
      return `
        SELECT
          '${fileType}'                  AS file_type,
          ${col('case_number')}::text    AS case_number,
          ${col('partial_case')}::text   AS partial_case,
          ${col('partyOne')}::text       AS party_one,
          ${col('partyTwo')}::text       AS party_two,
          ${col('year')}::int            AS year,
          ${col('createdBy')}::text      AS created_by,
          ${col('advocateId')}::text     AS adv_id
        FROM ${cfg.table}
        ${where}`;
    })
    .join(' UNION ALL ');
}

async function loadFiles({ onlyOwn, userId }) {
  if (Object.keys(CASE_TABLES).length === 0) return { groups: [], recent: [] };

  const union = filesUnion({ onlyOwn });
  const params = onlyOwn ? [userId] : [];

  const [groups, recent] = await Promise.all([
    sql.query(
      `SELECT file_type, year, adv_id, count(*)::int AS n
         FROM (${union}) f
     GROUP BY file_type, year, adv_id`,
      params
    ),
    sql.query(
      `SELECT file_type, case_number, partial_case, party_one, party_two, year, created_by
         FROM (${union}) f
     ORDER BY year DESC NULLS LAST,
              NULLIF(regexp_replace(case_number, '\\D', '', 'g'), '')::bigint DESC NULLS LAST,
              file_type
        LIMIT ${RECENT_LIMIT}`,
      params
    ),
  ]);

  return { groups, recent };
}

// Turns the grouped counts into the numbers and series the page draws.
function summarise({ groups, recent }, today = new Date()) {
  const currentYear = today.getFullYear();

  const byType = new Map(Object.keys(CASE_TABLES).map((type) => [type, 0]));
  const byYear = new Map();
  let files = 0;
  let undated = 0;

  for (const g of groups) {
    files += g.n;
    byType.set(g.file_type, (byType.get(g.file_type) ?? 0) + g.n);
    if (g.year == null) undated += g.n;
    else byYear.set(g.year, (byYear.get(g.year) ?? 0) + g.n);
  }

  // A fixed window of consecutive years (gaps count as 0) so the chart has no holes.
  const years = [...byYear.keys()];
  const end = Math.max(currentYear, ...years);
  const start = years.length
    ? Math.max(end - YEAR_WINDOW + 1, Math.min(...years))
    : end;
  const yearSeries = [];
  for (let y = start; y <= end; y++) yearSeries.push({ year: y, count: byYear.get(y) ?? 0 });
  const earlier = years.filter((y) => y < start).reduce((sum, y) => sum + byYear.get(y), 0);

  return {
    totals: {
      files,
      thisYear: byYear.get(currentYear) ?? 0,
      lastYear: byYear.get(currentYear - 1) ?? 0,
      undated,
      currentYear,
    },
    byType: [...byType.entries()]
      .map(([fileType, count]) => ({ fileType, count }))
      .sort((a, b) => b.count - a.count || a.fileType.localeCompare(b.fileType)),
    byYear: yearSeries,
    earlier,
    recent: recent.map((r) => ({
      id: r.case_number,
      fileType: r.file_type,
      caseNumber: r.case_number ?? undefined,
      partialCase: r.partial_case ?? undefined,
      partyOne: r.party_one ?? undefined,
      partyTwo: r.party_two ?? undefined,
      year: r.year ?? undefined,
      createdBy: r.created_by ?? undefined,
    })),
  };
}

router.get('/user', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const data = await loadFiles({ onlyOwn: true, userId: req.user.id });
    res.json({ scope: 'user', generatedAt: new Date().toISOString(), ...summarise(data) });
  } catch (err) {
    console.error('Failed to build user dashboard:', err);
    res.status(500).json({ error: 'Failed to load your dashboard.' });
  }
});

router.get('/admin', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({ error: 'Only administrators can view the firm dashboard.' });
    }

    const data = await loadFiles({ onlyOwn: false, userId: req.user.id });
    const summary = summarise(data);

    // Workload per advocate, plus files that belong to nobody.
    const currentYear = summary.totals.currentYear;
    const perAdvocate = new Map(); // adv_id -> { files, thisYear }
    let unassigned = 0;
    for (const g of data.groups) {
      if (g.adv_id == null) {
        unassigned += g.n;
        continue;
      }
      const entry = perAdvocate.get(g.adv_id) ?? { files: 0, thisYear: 0 };
      entry.files += g.n;
      if (g.year === currentYear) entry.thisYear += g.n;
      perAdvocate.set(g.adv_id, entry);
    }

    const ids = [...perAdvocate.keys()];
    const [people, team] = await Promise.all([
      ids.length
        ? sql.query(`SELECT id::text AS id, name FROM neon_auth."user" WHERE id::text = ANY($1)`, [ids])
        : Promise.resolve([]),
      sql`SELECT count(*)::int AS n FROM neon_auth."user"`,
    ]);
    const names = new Map(people.map((p) => [p.id, p.name]));

    const ranked = [...perAdvocate.entries()]
      .map(([id, v]) => {
        const name = names.get(id) ?? null;
        return {
          advocateId: id,
          name: name ?? 'Unknown advocate',
          initials: initialsFrom(name),
          files: v.files,
          thisYear: v.thisYear,
        };
      })
      .sort((a, b) => b.files - a.files || a.name.localeCompare(b.name));

    const shown = ranked.slice(0, TOP_ADVOCATES);
    const rest = ranked.slice(TOP_ADVOCATES);

    res.json({
      scope: 'admin',
      generatedAt: new Date().toISOString(),
      ...summary,
      team: { advocatesWithFiles: ranked.length, registeredUsers: team[0]?.n ?? 0 },
      unassigned,
      byAdvocate: shown,
      otherAdvocates: { advocates: rest.length, files: rest.reduce((s, a) => s + a.files, 0) },
    });
  } catch (err) {
    console.error('Failed to build admin dashboard:', err);
    res.status(500).json({ error: 'Failed to load the firm dashboard.' });
  }
});

export default router;
