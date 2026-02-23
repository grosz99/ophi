import type { ToolKey } from '@/types'

/** Maps each Alteryx tool key to its Excel/spreadsheet equivalent name and detail. */
export const EXCEL_MAPPINGS: Record<ToolKey, { tool: string; detail: string }> = {
  input_data:   { tool: 'Open File / Power Query Get Data', detail: 'File > Open or Data > Get Data to load CSV/Excel files' },
  output_data:  { tool: 'Save As / Export', detail: 'File > Save As to write results to CSV or Excel format' },
  filter:       { tool: 'AutoFilter / Advanced Filter', detail: 'Data > Filter to show only rows matching criteria' },
  formula:      { tool: 'Cell Formula', detail: 'Write a formula in a new column (e.g., =A2*B2)' },
  select:       { tool: 'Hide/Delete Columns', detail: 'Right-click column header > Hide, or select and keep only needed columns' },
  sort:         { tool: 'Sort (Data Tab)', detail: 'Data > Sort to reorder rows by one or more columns' },
  unique:       { tool: 'Remove Duplicates', detail: 'Data > Remove Duplicates to keep only unique rows' },
  sample:       { tool: 'Random Selection (manual)', detail: 'Use RAND() column + sort + take top N rows' },
  cleanse:      { tool: 'TRIM / CLEAN / Find & Replace', detail: 'Use TRIM(), CLEAN(), or Find & Replace to standardize text' },
  impute:       { tool: 'IF(ISBLANK()) Formula', detail: 'Use =IF(ISBLANK(A2), default, A2) to fill missing values' },
  summarize:    { tool: 'PivotTable / SUMIFS', detail: 'Insert > PivotTable to group and aggregate, or use SUMIFS/COUNTIFS' },
  crosstab:     { tool: 'PivotTable (Cross Tab)', detail: 'PivotTable with row and column fields to create a cross-tabulation' },
  transpose:    { tool: 'Paste Special > Transpose', detail: 'Copy range, then Paste Special > Transpose to flip rows/columns' },
  join:         { tool: 'VLOOKUP / XLOOKUP / Power Query Merge', detail: 'Use VLOOKUP(), XLOOKUP(), or Power Query Merge to combine tables' },
  union:        { tool: 'Copy & Paste / Power Query Append', detail: 'Stack tables by pasting below, or Data > Get Data > Append Queries' },
  text_to_cols: { tool: 'Text to Columns', detail: 'Data > Text to Columns to split a column by delimiter' },
  regex:        { tool: 'Find & Replace / Substitute', detail: 'Use Find & Replace or SUBSTITUTE() for pattern-based text changes' },
  datetime:     { tool: 'Date Functions (YEAR, MONTH, DAY)', detail: 'Use YEAR(), MONTH(), DAY(), TEXT() to parse and format dates' },
  multi_row:    { tool: 'Relative Cell Reference', detail: 'Reference previous/next rows with relative offsets like A1, A2' },
  browse:       { tool: 'View Data (scroll)', detail: 'Simply scroll through the spreadsheet to inspect values' },
  type_convert: { tool: 'Format Cells / VALUE()', detail: 'Right-click > Format Cells to change number/text/date type, or use VALUE()' },
}
