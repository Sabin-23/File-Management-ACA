import { Router } from 'express';
import { sql } from '../db.js';
import { CASE_TABLES } from '../config/caseTable.js';

const router = Router();

/**
 * Builds one SELECT per configured table (aliasing its columns to a common
 * shape), then UNION ALLs them together so the frontend gets every case
 * type back from a single request. Table/column names come only from our
 * own caseTables.js config - never from request input - so building this
 * as a plain string is safe.
 */
function buildListQuery() {
  const selects = Object.entries(CASE_TABLES).map(([fileType, cfg]) => {
    const col = (name) => cfg.columns[name] ?? 'NULL';

    return `
      SELECT
        ${col('reference')}::text       AS id,
        '${fileType}'                   AS file_type,
        ${col('reference')}::text       AS reference,
        ${col('courtCaseNumber')}::text AS court_case_number,
        ${col('partyOne')}::text        AS party_one,
        ${col('partyTwo')}::text        AS party_two,
        ${col('year')}                  AS year,
        ${col('createdBy')}::text       AS created_by
      FROM ${cfg.table}
    `;
  });

  return `${selects.join(' UNION ALL ')} ORDER BY year DESC NULLS LAST, id DESC`;
}

router.get('/', async (_req, res) => {
  if (Object.keys(CASE_TABLES).length === 0) {
    return res.json([]);
  }

  try {
    const rows = await sql`${sql.unsafe(buildListQuery())}`;

    const files = rows.map((row) => ({
      id: row.id,
      fileType: row.file_type,
      reference: row.reference,
      courtCaseNumber: row.court_case_number || undefined,
      partyOne: row.party_one || undefined,
      partyTwo: row.party_two || undefined,
      year: row.year ?? undefined,
      createdBy: row.created_by || undefined,
    }));

    res.json(files);
  } catch (err) {
    console.error('Failed to list case files:', err);
    res.status(500).json({ error: 'Failed to load case files.' });
  }
});

export default router;