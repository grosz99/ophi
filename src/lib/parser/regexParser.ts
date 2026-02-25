import type { ParsedStep, ToolKey } from '@/types'
import { TOOLS } from './toolDefinitions'
import { translateExprToAlteryx } from './expressionTranslator'

function makeStep(
  toolKey: ToolKey,
  code: string,
  lineNum: number,
  explain: string,
  alteryxTool: string,
  alteryxDetail: string
): ParsedStep {
  const tool = TOOLS[toolKey] || TOOLS['formula']
  return {
    toolKey,
    tool: tool.name,
    icon: tool.icon,
    cat: tool.cat,
    color: tool.color,
    code: code.trim(),
    line: lineNum,
    explain,
    alteryxTool,
    alteryxDetail,
  }
}

export function parseCode(code: string): ParsedStep[] {
  const rawLines = code.split('\n')

  // Join multi-line method chains into single logical lines.
  // A line is a continuation if it starts with '.' or ends with '(' or ','
  // while the next line starts with '.' or is an argument continuation.
  const joinedLines: Array<{ code: string; lineNum: number }> = []
  let i = 0
  while (i < rawLines.length) {
    const trimmed = rawLines[i].trim()
    if (!trimmed) { i++; continue }
    let combined = trimmed
    const startLine = i + 1
    // Keep consuming lines that look like continuations
    while (i + 1 < rawLines.length) {
      const next = rawLines[i + 1].trim()
      if (!next) { i++; break }
      const currentEndsOpen = /[,(+\-*\/=\\]$/.test(combined) || combined.endsWith('\\')
      const nextIsContinuation = next.startsWith('.') || next.startsWith(')') || next.startsWith(']') || next.startsWith('+')
      if (currentEndsOpen || nextIsContinuation) {
        combined += ' ' + next
        i++
      } else {
        break
      }
    }
    joinedLines.push({ code: combined, lineNum: startLine })
    i++
  }

  const steps: ParsedStep[] = []

  joinedLines.forEach(({ code: rawLine, lineNum }) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('import ') || line.startsWith('from ') || line.startsWith('print(') || line.startsWith('print ')) return

    // Skip pure exploration calls (pandas & polars)
    if (/^\w+\.(head|tail|info|describe|shape|dtypes|columns|schema|glimpse)\b/.test(line) && !line.includes('=')) {
      steps.push(makeStep('browse', line, lineNum,
        'Preview/inspect the data — view structure, shape, or sample rows.',
        'Browse', 'Similar to previewing data at any point in a workflow.'
      ))
      return
    }

    let m: RegExpMatchArray | null

    // ==================== INPUT ====================
    // pandas: pd.read_csv / polars: pl.read_csv / pl.scan_csv
    if ((m = line.match(/=\s*(?:pd|pl)\.(?:read|scan)_(csv|excel|json|sql|parquet|ipc)\s*\(\s*["']([^"']+)["']/))) {
      steps.push(makeStep('input_data', line, lineNum,
        `Load data from <strong>${m[2]}</strong> (${m[1].toUpperCase()} format) into a dataframe for processing.`,
        'Input Data', `Connects to "${m[2]}" and loads the data.`
      ))
      return
    }
    // chained read without assignment
    if ((m = line.match(/(?:pd|pl)\.(?:read|scan)_(csv|excel|json|parquet|ipc)\s*\(\s*["']([^"']+)["']/)) && !line.includes('=')) {
      steps.push(makeStep('input_data', line, lineNum,
        `Load data from <strong>${m[2]}</strong> (${m[1].toUpperCase()} format).`,
        'Input Data', `Reads from "${m[2]}".`
      ))
      return
    }

    // ==================== OUTPUT ====================
    // pandas: .to_csv / polars: .write_csv
    if ((m = line.match(/\.(?:to|write)_(csv|excel|json|parquet|ipc)\s*\(\s*["']([^"']+)["']/))) {
      steps.push(makeStep('output_data', line, lineNum,
        `Export the final results to <strong>${m[2]}</strong> (${m[1].toUpperCase()} format).`,
        'Output Data', `Writes results to "${m[2]}".`
      ))
      return
    }

    // ==================== FILTER ====================
    // polars: .filter(pl.col("col") > val)
    if ((m = line.match(/\.filter\(\s*(?:pl\.col\(["'](\w+)["']\)|.*?)\s*(>|>=|<|<=|==|!=)\s*(.+?)\s*\)/))) {
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data to keep only rows where <strong>${m[1] || 'condition'}</strong> ${m[2]} ${m[3]}.`,
        'Filter', `Condition: [${m[1] || 'expr'}] ${m[2]} ${m[3]}`
      ))
      return
    }
    // polars: .filter(pl.col("col").is_in([...]))
    if (line.includes('.filter(') && line.includes('.is_in(')) {
      const colMatch = line.match(/pl\.col\(["'](\w+)["']\)/)
      const valMatch = line.match(/\.is_in\(\s*(.+?)\s*\)/)
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data to keep only rows where <strong>${colMatch ? colMatch[1] : 'column'}</strong> is one of: ${valMatch ? valMatch[1] : 'specified values'}.`,
        'Filter', `Condition: ${colMatch ? colMatch[1] : 'column'} in ${valMatch ? valMatch[1] : '...'}`
      ))
      return
    }
    // polars: .filter(pl.col("col").is_not_null())
    if (line.includes('.filter(') && line.includes('.is_not_null()')) {
      const colMatch = line.match(/pl\.col\(["'](\w+)["']\)/)
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data to keep only rows where <strong>${colMatch ? colMatch[1] : 'column'}</strong> is not null.`,
        'Filter', `Removes null rows from ${colMatch ? colMatch[1] : 'column'}.`
      ))
      return
    }
    // pandas: df[df['col'] > val] or .isin()
    if ((m = line.match(/=\s*\w+\[\s*\w+\[["'](\w+)["']\]\s*(>|>=|<|<=|==|!=)\s*(.+?)\s*\]/)) ||
        (m = line.match(/=\s*\w+\[\s*\w+\[["'](\w+)["']\]\.isin\(\s*(.+?)\s*\)/))) {
      const isIsin = line.includes('.isin(')
      const desc = isIsin
        ? `Filter the data to keep only rows where <strong>${m[1]}</strong> is one of: ${m[2]}`
        : `Filter the data to keep only rows where <strong>${m[1]}</strong> ${m[2]} ${m[3]}.`
      steps.push(makeStep('filter', line, lineNum, desc,
        'Filter', `Condition: ${isIsin ? `${m[1]} in ${m[2]}` : `[${m[1]}] ${m[2]} ${m[3]}`}`
      ))
      return
    }
    if ((m = line.match(/\.query\(\s*["'](.+?)["']\s*\)/))) {
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data using the condition: <strong>${m[1]}</strong>.`,
        'Filter', `Condition: ${m[1]}`
      ))
      return
    }
    // pandas: df[df['col'] != 'val']
    if ((m = line.match(/=\s*\w+\[\s*\w+\[["'](.+?)["']\]\s*(!=|==)\s*["'](.+?)["']\s*\]/))) {
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data: keep rows where <strong>${m[1]}</strong> ${m[2] === '!=' ? 'does not equal' : 'equals'} "${m[3]}".`,
        'Filter', `Condition: [${m[1]}] ${m[2]} "${m[3]}"`
      ))
      return
    }

    // ==================== NULL HANDLING ====================
    // pandas: .dropna() / polars: .drop_nulls()
    if (line.includes('.dropna(') || line.includes('.drop_nulls(')) {
      const subsetMatch = line.match(/subset\s*=\s*\[(.+?)\]/)
      const cols = subsetMatch ? subsetMatch[1].replace(/["']/g, '') : 'all columns'
      steps.push(makeStep('filter', line, lineNum,
        `Remove rows with missing (null/NaN) values${subsetMatch ? ` in columns: <strong>${cols}</strong>` : ''}.`,
        'Filter', 'Removes rows with null values.'
      ))
      return
    }
    // pandas: .fillna() / polars: .fill_null()
    if (line.includes('.fillna(') || line.includes('.fill_null(')) {
      // Extract the fill value — first argument before any keyword args
      const fillMatch = line.match(/\.(?:fillna|fill_null)\(\s*([^,)]+)/)
      const fillVal = fillMatch ? fillMatch[1].trim() : 'a value'
      const method = line.match(/method\s*=\s*["'](\w+)["']/)
      const desc = method
        ? `Fill missing values using method: <strong>${method[1]}</strong>.`
        : `Replace missing (null) values with <strong>${fillVal}</strong>.`
      steps.push(makeStep('impute', line, lineNum, desc,
        'Imputation', method ? `Fill method: ${method[1]}.` : `Fills nulls with ${fillVal}.`
      ))
      return
    }

    // ==================== FORMULA / DERIVED COLUMNS ====================
    // polars: .with_columns(...)
    if (line.includes('.with_columns(')) {
      const aliasMatch = line.match(/\.alias\(\s*["'](\w+)["']\s*\)/)
      const colName = aliasMatch ? aliasMatch[1] : null
      steps.push(makeStep('formula', line, lineNum,
        colName
          ? `Create or update column <strong>${colName}</strong> using a Polars expression.`
          : 'Create or update columns using Polars expressions.',
        'Formula', colName ? `Output column: "${colName}"` : 'Creates/updates columns.'
      ))
      return
    }
    // pandas: df['new'] = expression
    if ((m = line.match(/\w+\[["'](\w+)["']\]\s*=\s*(.+)/)) && !line.match(/\.str\.|\.dt\.|\.astype|pd\.to_|pl\.col/)) {
      steps.push(makeStep('formula', line, lineNum,
        `Create or update column <strong>${m[1]}</strong> with the formula: <code>${m[2].trim()}</code>.`,
        'Formula', `Output column: "${m[1]}" = ${translateExprToAlteryx(m[2].trim())}`
      ))
      return
    }
    if (line.includes('.assign(')) {
      // Extract all keyword argument names (each is a new column)
      const assignCols: string[] = []
      const assignRe = /(\w+)\s*=/g
      // Skip the object before .assign( itself
      const assignBody = line.replace(/^.*?\.assign\(/, '')
      let am: RegExpExecArray | null
      while ((am = assignRe.exec(assignBody)) !== null) {
        if (am[1] !== 'lambda') assignCols.push(am[1])
      }
      const colList = assignCols.length > 0 ? assignCols.join(', ') : 'new columns'
      steps.push(makeStep('formula', line, lineNum,
        `Create new column${assignCols.length > 1 ? 's' : ''}: <strong>${colList}</strong>.`,
        'Formula', `Creates column${assignCols.length > 1 ? 's' : ''}: ${colList}.`
      ))
      return
    }
    // pd.cut / pd.qcut
    if (line.includes('pd.cut(') || line.includes('pd.qcut(')) {
      const colMatch = line.match(/\[["'](\w+)["']\]\s*=/)
      steps.push(makeStep('formula', line, lineNum,
        `Create a binned/bucketed column${colMatch ? ` <strong>${colMatch[1]}</strong>` : ''} — divides continuous values into discrete categories.`,
        'Formula', 'Bins continuous values into categories.'
      ))
      return
    }

    // ==================== STRING OPERATIONS ====================
    // pandas: .str.lower() etc / polars: .str.to_lowercase() etc
    if (line.includes('.str.strip()') || line.includes('.str.lower()') || line.includes('.str.upper()') || line.includes('.str.title()')
        || line.includes('.str.to_lowercase()') || line.includes('.str.to_uppercase()') || line.includes('.str.to_titlecase()') || line.includes('.str.strip_chars(')) {
      const ops: string[] = []
      if (line.includes('strip')) ops.push('trim whitespace')
      if (line.includes('lower') || line.includes('to_lowercase')) ops.push('lowercase')
      if (line.includes('upper') || line.includes('to_uppercase')) ops.push('uppercase')
      if (line.includes('title') || line.includes('to_titlecase')) ops.push('title case')
      steps.push(makeStep('cleanse', line, lineNum,
        `Clean text data: <strong>${ops.join(', ')}</strong>.`,
        'Data Cleansing', `Operations: ${ops.join(', ')}.`
      ))
      return
    }
    if ((m = line.match(/\.str\.replace\(\s*["'](.+?)["']\s*,\s*["'](.*?)["']/))) {
      steps.push(makeStep('formula', line, lineNum,
        `Replace text: change "<strong>${m[1]}</strong>" to "<strong>${m[2]}</strong>" in the string values.`,
        'Formula', `Replace "${m[1]}" with "${m[2]}".`
      ))
      return
    }
    if (line.includes('.str.split(')) {
      steps.push(makeStep('text_to_cols', line, lineNum,
        'Split a text column into multiple columns based on a delimiter.',
        'Text to Columns', 'Splits on a delimiter into separate columns.'
      ))
      return
    }
    if (line.includes('.str.extract(')) {
      steps.push(makeStep('regex', line, lineNum,
        'Extract text patterns from a column using a regular expression.',
        'RegEx', 'Parses text using a regex pattern.'
      ))
      return
    }

    // ==================== DATETIME ====================
    // pandas: pd.to_datetime() / polars: .str.to_date() / .str.to_datetime() / .dt.year() etc
    if (line.includes('pd.to_datetime(') || line.includes('.str.to_date(') || line.includes('.str.to_datetime(')
        || line.includes('.dt.year') || line.includes('.dt.month') || line.includes('.dt.day')
        || line.includes('.dt.date') || line.includes('.dt.day_name') || line.includes('.dt.hour')) {
      const parts: string[] = []
      if (line.includes('.dt.year')) parts.push('Year')
      if (line.includes('.dt.month')) parts.push('Month')
      if (line.includes('.dt.day_name')) parts.push('Day of Week')
      else if (line.includes('.dt.day') || line.includes('.dt.date')) parts.push('Date')
      if (line.includes('.dt.hour')) parts.push('Hour')
      const isConvert = line.includes('to_datetime') || line.includes('to_date')
      if (isConvert && parts.length === 0) parts.push('datetime')
      steps.push(makeStep('datetime', line, lineNum,
        `${isConvert && parts.includes('datetime') ? 'Convert a text column to a proper date/time format' : `Extract <strong>${parts.join(', ')}</strong> from a date column`}.`,
        'DateTime', `Extracts: ${parts.join(', ')}.`
      ))
      return
    }

    // ==================== TYPE CONVERSION ====================
    // pandas: .astype() / polars: .cast()
    if (line.includes('.astype(') || line.includes('pd.to_numeric(') || line.includes('.cast(')) {
      steps.push(makeStep('type_convert', line, lineNum,
        'Convert column data types (e.g., text to number, number to string).',
        'Select (Change Type)', 'Changes column data types.'
      ))
      return
    }

    // ==================== SELECT COLUMNS ====================
    // polars: .select([...]) or .select("col1", "col2")
    if (line.includes('.select(') && !line.includes('.filter(') && !line.includes('.with_columns(')) {
      const colMatch = line.match(/\.select\(\s*\[?(.+?)\]?\s*\)/)
      const cols = colMatch ? colMatch[1].replace(/["'pl.col()]/g, '') : 'specified columns'
      steps.push(makeStep('select', line, lineNum,
        `Select specific columns to keep: <strong>${cols}</strong>. All other columns are removed.`,
        'Select', `Keeps: ${cols}.`
      ))
      return
    }
    // pandas: df[['col1','col2']]
    if ((m = line.match(/=\s*\w+\[\s*\[(.+?)\]\s*\]/)) && m[1].includes("'")) {
      steps.push(makeStep('select', line, lineNum,
        `Select specific columns to keep: <strong>${m[1].replace(/["']/g, '')}</strong>. All other columns are removed.`,
        'Select', `Keeps: ${m[1].replace(/["']/g, '')}.`
      ))
      return
    }
    // pandas: .drop(columns=[]) / polars: .drop([...]) or .drop("col")
    if (line.includes('.drop(')) {
      const colMatch = line.match(/\.drop\(\s*(?:columns\s*=\s*)?\[(.+?)\]/) || line.match(/\.drop\(\s*["'](.+?)["']/)
      if (colMatch) {
        steps.push(makeStep('select', line, lineNum,
          `Remove columns: <strong>${colMatch[1].replace(/["']/g, '')}</strong> from the data.`,
          'Select', `Drops: ${colMatch[1].replace(/["']/g, '')}.`
        ))
        return
      }
    }
    // .rename()
    if (line.includes('.rename(')) {
      steps.push(makeStep('select', line, lineNum,
        'Rename columns to more meaningful names.',
        'Select (Rename)', 'Renames columns.'
      ))
      return
    }
    // .columns = ... (bulk rename)
    if (line.includes('.columns') && line.includes('.str.')) {
      steps.push(makeStep('cleanse', line, lineNum,
        'Clean up all column names — standardize formatting (strip whitespace, replace special characters).',
        'Data Cleansing', 'Standardizes column name formatting.'
      ))
      return
    }

    // ==================== SORT ====================
    // pandas: .sort_values() / polars: .sort()
    if (line.includes('.sort_values(')) {
      const desc = line.includes('ascending=False') || line.includes('ascending = False')
      // Handle by='col', by=['col1','col2'], or positional first arg
      const byMatch = line.match(/by\s*=\s*\[([^\]]+)\]/) || line.match(/by\s*=\s*["'](\w+)["']/) || line.match(/\.sort_values\(\s*["'](\w+)["']/) || line.match(/\.sort_values\(\s*\[([^\]]+)\]/)
      const cols = byMatch ? byMatch[1].replace(/["']/g, '') : 'column'
      steps.push(makeStep('sort', line, lineNum,
        `Sort the data by <strong>${cols}</strong> in <strong>${desc ? 'descending' : 'ascending'}</strong> order.`,
        'Sort', `By "${cols}", ${desc ? 'descending' : 'ascending'}.`
      ))
      return
    }
    if (line.includes('.sort(') && !line.includes('.sort_values')) {
      const desc = line.includes('descending=True') || line.includes('descending = True')
      const byMatch = line.match(/\.sort\(\s*\[([^\]]+)\]/) || line.match(/\.sort\(\s*["'](\w+)["']/)
      const cols = byMatch ? byMatch[1].replace(/["']/g, '') : 'column'
      steps.push(makeStep('sort', line, lineNum,
        `Sort the data by <strong>${cols}</strong> in <strong>${desc ? 'descending' : 'ascending'}</strong> order.`,
        'Sort', `By "${cols}", ${desc ? 'descending' : 'ascending'}.`
      ))
      return
    }

    // ==================== UNIQUE ====================
    // pandas: .drop_duplicates() / polars: .unique()
    if (line.includes('.drop_duplicates(')) {
      const subMatch = line.match(/subset\s*=\s*\[(.+?)\]/)
      steps.push(makeStep('unique', line, lineNum,
        `Remove duplicate rows${subMatch ? ` based on columns: <strong>${subMatch[1].replace(/["']/g, '')}</strong>` : ''}.`,
        'Unique', `Deduplicates${subMatch ? ` on: ${subMatch[1].replace(/["']/g, '')}` : ''}.`
      ))
      return
    }
    if (line.includes('.unique(') && !line.includes('.n_unique(') && !line.includes('value_counts')) {
      const subMatch = line.match(/subset\s*=\s*\[(.+?)\]/) || line.match(/\.unique\(\s*["'](\w+)["']/)
      steps.push(makeStep('unique', line, lineNum,
        `Remove duplicate rows${subMatch ? ` based on columns: <strong>${subMatch[1].replace(/["']/g, '')}</strong>` : ''}.`,
        'Unique', `Deduplicates${subMatch ? ` on: ${subMatch[1].replace(/["']/g, '')}` : ''}.`
      ))
      return
    }

    // ==================== SAMPLE ====================
    if ((m = line.match(/\.(sample|head|tail)\(\s*(?:n\s*=\s*)?(\d+)?/))) {
      const n = m[2] || '5'
      const type = m[1]
      steps.push(makeStep('sample', line, lineNum,
        `Take a ${type === 'sample' ? 'random sample' : type === 'head' ? 'first' : 'last'} <strong>${n}</strong> rows from the data.`,
        'Sample', `${type === 'sample' ? `Random ${n} records` : `First ${n} records`}.`
      ))
      return
    }

    // ==================== SUMMARIZE / GROUPBY ====================
    // pandas: .groupby() / polars: .group_by()
    if ((line.includes('.groupby(') || line.includes('.group_by(')) &&
        (line.includes('.agg(') || line.includes('.agg ') || line.includes('.sum()') || line.includes('.mean()') || line.includes('.count()') || line.includes('.nunique()') || line.includes('.n_unique()'))) {
      // Extract group keys — stop at first comma that's outside the key list or at closing paren
      const grpMatch = line.match(/\.group(?:_)?by\(\s*\[([^\]]+)\]/) ||  // by=['a','b']
                       line.match(/\.group(?:_)?by\(\s*["']([^"']+)["']/)   // by='a'
      const groups = grpMatch ? grpMatch[1].replace(/["']/g, '').trim() : '?'

      // Collect named aggregations: name=pd.NamedAgg(...) or name=(col, func)
      const namedAggs: string[] = []
      const namedAggRe = /(\w+)\s*=\s*(?:pd\.NamedAgg\(\s*column\s*=\s*["'](\w+)["']\s*,\s*aggfunc\s*=\s*["']?(\w+)["']?\s*\)|\(\s*["'](\w+)["']\s*,\s*["']?(\w+)["']?\s*\))/g
      let na: RegExpExecArray | null
      while ((na = namedAggRe.exec(line)) !== null) {
        const outCol = na[1]
        const srcCol = na[2] || na[4]
        const func = na[3] || na[5]
        namedAggs.push(`${outCol} = ${func}(${srcCol})`)
      }

      let aggDesc = 'aggregate'
      if (line.includes('.sum()') || line.includes('"sum"') || line.includes("'sum'")) aggDesc = 'sum'
      else if (line.includes('.mean()') || line.includes('"mean"') || line.includes("'mean'")) aggDesc = 'average'
      else if (line.includes('.count()') || line.includes('"count"') || line.includes("'count'")) aggDesc = 'count'
      else if (line.includes('.nunique()') || line.includes('.n_unique(') || line.includes('"nunique"') || line.includes("'nunique'")) aggDesc = 'count distinct'
      else if (line.includes('"max"') || line.includes("'max'") || line.includes('.max()')) aggDesc = 'max'
      else if (line.includes('"min"') || line.includes("'min'") || line.includes('.min()')) aggDesc = 'min'

      const aggList = namedAggs.length > 0
        ? `<strong>${namedAggs.join(', ')}</strong>`
        : `<strong>${aggDesc}</strong>`

      steps.push(makeStep('summarize', line, lineNum,
        `Group the data by <strong>${groups}</strong> and calculate ${aggList} for each group.`,
        'Summarize', `Group by: ${groups}. Aggregations: ${namedAggs.length > 0 ? namedAggs.join('; ') : aggDesc}.`
      ))
      return
    }
    // Standalone .agg() without groupby — whole-table aggregation
    if (line.includes('.agg(') && !line.includes('.groupby(') && !line.includes('.group_by(')) {
      steps.push(makeStep('summarize', line, lineNum,
        'Aggregate the entire dataset — compute summary statistics across all rows.',
        'Summarize', 'Whole-table aggregation.'
      ))
      return
    }
    // .value_counts()
    if (line.includes('.value_counts()')) {
      steps.push(makeStep('summarize', line, lineNum,
        'Count the frequency of each unique value — like a quick "group by + count".',
        'Summarize', 'Counts each unique value.'
      ))
      return
    }

    // ==================== PIVOT ====================
    if (line.includes('.pivot_table(') || line.includes('.pivot(')) {
      const indexMatch = line.match(/index\s*=\s*["'](\w+)["']/)
      const colsMatch = line.match(/columns\s*=\s*["'](\w+)["']/)
      const valsMatch = line.match(/values\s*=\s*["'](\w+)["']/)
      const detail = [
        indexMatch ? `rows: ${indexMatch[1]}` : null,
        colsMatch ? `columns: ${colsMatch[1]}` : null,
        valsMatch ? `values: ${valsMatch[1]}` : null,
      ].filter(Boolean).join(', ')
      steps.push(makeStep('crosstab', line, lineNum,
        `Create a pivot table — reorganize the data so row values become column headers${detail ? ` (${detail})` : ''}.`,
        'Cross Tab', detail ? `Pivots: ${detail}.` : 'Pivots rows into columns.'
      ))
      return
    }
    // pandas: .melt() / polars: .unpivot() / .stack() / .unstack()
    if (line.includes('.melt(') || line.includes('.unpivot(') || line.includes('.stack()') || line.includes('.unstack()')) {
      steps.push(makeStep('transpose', line, lineNum,
        `Reshape the data — ${line.includes('melt') || line.includes('unpivot') ? 'unpivot columns into rows (wide to long)' : 'transpose the data structure'}.`,
        'Transpose', 'Unpivots columns into rows.'
      ))
      return
    }

    // ==================== JOIN ====================
    // pandas: pd.merge() / .merge() / .join() — polars: .join()
    if (line.includes('pd.merge(') || line.includes('.merge(') || line.includes('.join(')) {
      const howMatch = line.match(/how\s*=\s*["'](\w+)["']/)
      const joinType = howMatch ? howMatch[1] : 'inner'
      // on= single key, on=[...] multi-key, or left_on=/right_on=
      const onSingle = line.match(/\bon\s*=\s*["'](\w+)["']/)
      const onMulti = line.match(/\bon\s*=\s*\[([^\]]+)\]/)
      const leftOn = line.match(/left_on\s*=\s*["'](\w+)["']/)
      const rightOn = line.match(/right_on\s*=\s*["'](\w+)["']/)
      let onDesc = ''
      if (onMulti) onDesc = ` on [${onMulti[1].replace(/["']/g, '')}]`
      else if (onSingle) onDesc = ` on <strong>${onSingle[1]}</strong>`
      else if (leftOn && rightOn) onDesc = ` on ${leftOn[1]} = ${rightOn[1]}`
      steps.push(makeStep('join', line, lineNum,
        `Join (merge) two datasets using a <strong>${joinType}</strong> join${onDesc}.`,
        'Join', `${joinType} join${onDesc ? ` (${onDesc.replace(/<\/?strong>/g, '')})` : ''}.`
      ))
      return
    }

    // ==================== UNION ====================
    // pandas: pd.concat() / polars: pl.concat()
    if (line.includes('pd.concat(') || line.includes('pl.concat(')) {
      steps.push(makeStep('union', line, lineNum,
        'Stack (append) multiple datasets together vertically — combining rows from two or more tables.',
        'Union', 'Stacks rows from multiple datasets.'
      ))
      return
    }

    // ==================== REPLACE ====================
    if (line.includes('.replace(') && !line.includes('.str.replace')) {
      steps.push(makeStep('formula', line, lineNum,
        'Replace specific values in the data with new values.',
        'Formula', 'Swaps values using a mapping.'
      ))
      return
    }

    // ==================== POLARS COLLECT ====================
    // polars lazy: .collect()
    if (line.includes('.collect()')) return

    // ==================== SKIP PATTERNS ====================
    if (line.includes('.reset_index(')) return
    if (line.match(/=\s*\w+\.(?:copy|clone)\(\)/)) return
    if (line.match(/^\.reset_index/) || line.match(/^["']\w+["']\s*:/) || line.match(/^\}\)/) || line.match(/^\s*\)/)) return
    // polars expression continuations
    if (line.match(/^\s*pl\.col\(/) || line.match(/^\s*\]\s*\)/) || line.match(/^\s*\.\s*(alias|over|sort_by)\(/)) return
  })

  return steps
}
