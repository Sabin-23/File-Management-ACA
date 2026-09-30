/**
 * One entry per case-type table.
 *
 * As you create the remaining tables (civils, criminals, labors,
 * administratives, arbitrations, consultancies), add an entry for each one
 * here - nothing else in the server needs to change, the list endpoint
 * picks up every table listed in this object automatically.
 *
 * `columns` maps a *generic* field name (used by the API response) to the
 * *actual* column name in that Postgres table. The values below are my
 * best guess from your commercials.csv headers, converted to snake_case
 * (COURT CASE NUMBER -> court_case_number, etc). If your real columns are
 * named differently, run `\d commercials` in psql and fix the values here.
 *
 * A field can be omitted/left out if that table doesn't have it - the
 * query will just return NULL for it.
 */
export const CASE_TABLES = {
  commercial: {
    table: 'commercialss',
    columns: {
      reference: 'aca_case_number', // e.g. "ACA 0484/COM/2026"
      courtCaseNumber: 'court_case_number', // e.g. "RCOM 00343/2025/TC"
      partyOne: 'plaintiff',
      partyTwo: 'defendant',
      year: 'year',
      createdBy: 'initials',
    },
  },

  // civil: {
  //   table: 'civils',
  //   columns: { reference: '...', courtCaseNumber: '...', partyOne: '...', partyTwo: '...', year: '...', createdBy: '...' },
  // },
  // criminal: { table: 'criminals', columns: { /* ... */ } },
  // labor: { table: 'labors', columns: { /* ... */ } },
  // administrative: { table: 'administratives', columns: { /* ... */ } },
  // arbitration: { table: 'arbitrations', columns: { /* ... */ } },
  // consultancy: { table: 'consultancies', columns: { /* ... */ } },
};