import { Router } from 'express';
import { sql } from '../db.js';
import { CASE_TABLES } from '../config/caseTable.js';
import { requireAuth } from '../requireauth.js';

const router = Router();


function ownFilter(cfg, onlyOwn) {
  if (!onlyOwn) return '';
  return cfg.columns.advocateId
    ? `WHERE ${cfg.columns.advocateId} = $1`
    : 'WHERE FALSE';
}


async function isAdmin(userId) {
  const rows = await sql`
    SELECT 1 FROM neon_auth."user"
    WHERE id = ${userId} AND 'admin' = ANY(string_to_array(role, ','))
    LIMIT 1
  `;
  return rows.length > 0;
}


function buildListQuery({ onlyOwn }) {
  const selects = Object.entries(CASE_TABLES).map(([fileType, cfg]) => {
    const col = (name) => cfg.columns[name] ?? 'NULL';

    return `
      SELECT
        ${col('case_number')}::text       AS id,
        '${fileType}'                   AS file_type,
        ${col('case_number')}::text       AS case_number,
        ${col('partial_case')}::text       AS partial_case,
        ${col('courtCaseNumber')}::text AS court_case_number,
        ${col('partyOne')}::text        AS party_one,
        ${col('partyTwo')}::text        AS party_two,
        ${col('year')}                  AS year,
        ${col('createdBy')}::text       AS created_by
      FROM ${cfg.table}
      ${ownFilter(cfg, onlyOwn)}
    `;
  });

  return `${selects.join(' UNION ALL ')} ORDER BY year DESC NULLS LAST, id DESC`;
}

router.get('/', requireAuth, async (req, res) => {
  if (Object.keys(CASE_TABLES).length === 0) {
    return res.json([]);
  }

  try {
    const admin = await isAdmin(req.user.id);

    
    const rows = await sql.query(
      buildListQuery({ onlyOwn: !admin }),
      admin ? [] : [req.user.id]
    );

    const files = rows.map((row) => ({
      id: row.id,
      fileType: row.file_type,
      caseNumber: row.case_number || undefined,
      partialCase: row.partial_case || undefined,
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


async function resolveAdvocate(typedName, authUserId) {
  const name = typeof typedName === 'string' ? typedName.trim() : '';

  if (name) {
    const matches = await sql`
      SELECT id FROM neon_auth."user" WHERE lower(name) = lower(${name}) LIMIT 2
    `;
    // Only link when unambiguous.
    return { id: matches.length === 1 ? matches[0].id : null, name };
  }

  const users = await sql`
    SELECT id, name FROM neon_auth."user" WHERE id = ${authUserId} LIMIT 1
  `;
  if (users.length === 0) {
    return null;
  }
  return { id: users[0].id, name: users[0].name };
}

router.post('/:fileType', requireAuth, async (req, res) => {
  const { fileType } = req.params;
  const cfg = CASE_TABLES[fileType];

  if (!cfg) {
    return res.status(400).json({
      error: `No table is configured yet for case type "${fileType}". Add an entry to server/config/caseTables.js once that table exists.`,
    });
  }

  if (typeof cfg.mapFormToRow !== 'function') {
    return res.status(501).json({
      error: `Case type "${fileType}" has a table configured but no form mapping (mapFormToRow) yet.`,
    });
  }

  try {
    const advocate = await resolveAdvocate(
      req.body?.advocate_assigned,
      req.user.id 
    );

    if (!advocate) {
      return res.status(400).json({
        error:
          'Your account was not found in neon_auth.user, so the file could not be assigned to you.',
      });
    }

    const row = cfg.mapFormToRow(req.body ?? {}, { advocate });

    const insertCols = [];
    const insertVals = [];

    for (const [field, column] of Object.entries(cfg.columns)) {
      if (row[field] !== undefined) {
        insertCols.push(column);
        insertVals.push(row[field]);
      }
    }

    if (insertCols.length === 0) {
      return res.status(400).json({ error: 'Nothing to insert.' });
    }

    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${cfg.table} (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    
    const inserted = await sql.query(query, insertVals);

    res.status(201).json({ ok: true, row: inserted[0] });
  } catch (err) {
    console.error('Failed to insert case file:', err);
    res.status(500).json({ error: 'Failed to save case file.' });
  }
});

export default router;