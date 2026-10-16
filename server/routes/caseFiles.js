import { Router } from 'express';
import { sql } from '../db.js';
import { CASE_TABLES } from '../config/caseTable.js';
import { requireAuth } from '../requireauth.js';
import * as XLSX from 'xlsx';

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
        ${col('civil_party')}::text     AS civil_party,
        ${col('year')}                  AS year,
        ${col('createdBy')}::text       AS created_by,
        ${col('company')}::text      AS company,
        ${col('individual')}::text      AS individual,
        ${col('assignments')}::text      AS assignments
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
      civil_party: row.civil_party || undefined,
      year: row.year ?? undefined,
      createdBy: row.created_by || undefined,
      individual: row.individual || undefined,
      company: row.company || undefined,
      assignments: row.assignments || undefined
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
//UPDATE a case file
router.put('/:fileType/:case_number', requireAuth, async (req, res) => {
  const { fileType, case_number } = req.params;
  const cfg = CASE_TABLES[fileType];

  if (!cfg) {
    return res.status(400).json({ error: 'Invalid case type.' });
  }

  try {
    const admin = await isAdmin(req.user.id);

    // If not admin, check ownership using parameterized query
    if (!admin) {
      const checkQuery = `SELECT case_number FROM ${cfg.table} WHERE case_number = $1 AND adv_id = $2`;
      const existing = await sql.query(checkQuery, [case_number, req.user.id]);

      if (existing.length === 0) {
        return res
          .status(403)
          .json({ error: 'Unauthorized to update this case file.' });
      }
    }

    // Resolve assigned advocate or fall back to current user
    const advocate = await resolveAdvocate(
      req.body?.advocate_assigned,
      req.user.id
    );

    if (!advocate) {
      return res.status(400).json({
        error: 'Your account was not found in neon_auth.user.',
      });
    }

    // Map form body into table structure
    const row = cfg.mapFormToRow(req.body ?? {}, { advocate });

    // Build dynamic UPDATE set clauses and parameters safely
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [field, column] of Object.entries(cfg.columns)) {
      if (row[field] !== undefined) {
        let val = row[field];

        // Sanitize objects/arrays into JSON strings or null if undefined
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }

        setClauses.push(`${column} = $${paramIndex++}`);
        values.push(val ?? null);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    // Append the record ID to values for the WHERE clause
    values.push(case_number);
    const updateQuery = `UPDATE ${cfg.table} SET ${setClauses.join(', ')} WHERE case_number = $${paramIndex} RETURNING *`;

    const updated = await sql.query(updateQuery, values);

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Case file not found.' });
    }

    res.json({ ok: true, row: updated[0] });
  } catch (err) {
    console.error('Failed to update case file:', err);
    res.status(500).json({ error: 'Failed to update case file.' });
  }
});

router.delete('/:fileType/:case_number', requireAuth, async (req, res) => {
  const { fileType, case_number } = req.params;
  const cfg = CASE_TABLES[fileType];

  if (!cfg) {
    return res.status(400).json({ error: 'Invalid case type.' });
  }

  try {
    const admin = await isAdmin(req.user.id);

    if (!admin) {
      const checkQuery = `SELECT case_number FROM ${cfg.table} WHERE case_number = $1 AND adv_id = $2`;
      const existing = await sql.query(checkQuery, [case_number, req.user.id]);

      if (existing.length === 0) {
        return res
          .status(403)
          .json({ error: 'Unauthorized to delete this file.' });
      }
    }

    const deleteQuery = `DELETE FROM ${cfg.table} WHERE case_number = $1`;
    await sql.query(deleteQuery, [case_number]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete case file:', err);
    res.status(500).json({ error: 'Failed to delete case file.' });
  }
});

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


router.patch('/:fileType/:case_number/transfer', requireAuth, async (req, res) => {
  const { fileType, case_number } = req.params;
  const { advocateName } = req.body;
  const cfg = CASE_TABLES[fileType];

  if (!cfg) {
    return res.status(400).json({ error: 'Invalid case type.' });
  }

  if (!advocateName || !advocateName.trim()) {
    return res.status(400).json({ error: 'Advocate name is required.' });
  }

  try {
    const admin = await isAdmin(req.user.id);
    if (!admin) {
      return res
        .status(403)
        .json({ error: 'Only administrators can transfer files.' });
    }

    const targetName = advocateName.trim();
    const advocateQuery = `
      SELECT id, name FROM neon_auth."user" 
      WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE LOWER($2)
      LIMIT 1
    `;
    const advocateRows = await sql.query(advocateQuery, [targetName, `%${targetName}%`]);

    if (advocateRows.length === 0) {
      return res.status(444 || 404).json({
        error: `No advocate found matching "${targetName}" in neon_auth.user.`,
      });
    }

    const targetAdvocate = advocateRows[0];
    const newAdvocateId = targetAdvocate.id;
    const newInitials = initialsFrom(targetAdvocate.name);


    const transferQuery = `
      UPDATE ${cfg.table} 
      SET ${cfg.columns.advocateId} = $1, ${cfg.columns.createdBy} = $2 
      WHERE case_number = $3 
      RETURNING *
    `;
    const updated = await sql.query(transferQuery, [
      newAdvocateId,
      newInitials,
      case_number,
    ]);

    res.json({
      ok: true,
      row: updated[0],
      assignedTo: targetAdvocate.name,
      initials: newInitials,
    });
  } catch (err) {
    console.error('Failed to transfer case file:', err);
    res.status(500).json({ error: 'Failed to transfer case file.' });
  }
});

router.get('/export/:fileType', requireAuth, async (req, res) => {
  const { fileType } = req.params;
  const cfg = CASE_TABLES[fileType];

  if (!cfg) {
    return res.status(400).json({ error: 'Invalid case type specified for export.' });
  }

  try {
    const query = `SELECT * FROM ${cfg.table} ORDER BY case_number DESC`;
    const rows = await sql.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ error: `No records found in ${fileType} table.` });
    }

    const cleanedRows = rows.map(row => {
      const copy = { ...row };

      const caseNumCol = cfg.columns?.case_number || 'case_number';
      const partialCol = cfg.columns?.partial_case || 'partial_case';

      const caseNum = row[caseNumCol];
      const partialCase = row[partialCol];

      if (caseNum !== undefined && caseNum !== null) {
        copy['ACA CASE NUMBER'] = partialCase 
          ? `ACA ${caseNum}/${partialCase}` 
          : `ACA ${caseNum}`;
      } else {
        copy['ACA CASE NUMBER'] = '';
      }

      
      delete copy[caseNumCol];
      delete copy[partialCol];
      delete copy.adv_id; 

      return copy;
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, fileType.toUpperCase());

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileType}_cases_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.send(excelBuffer);
  } catch (err) {
    console.error('Failed to export Excel file:', err);
    res.status(500).json({ error: 'Failed to generate Excel file.' });
  }
});

export default router;