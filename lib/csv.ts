/** CSV that opens cleanly in Excel and Google Sheets (UTF-8 BOM, quoted cells, CRLF). */
export function toCsv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    // guard against formula injection when opened in a spreadsheet
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')
}
export function csvResponse(name: string, body: string) {
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' } })
}
