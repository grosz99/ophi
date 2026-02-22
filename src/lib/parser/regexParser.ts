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
  const lines = code.split('\n')
  const steps: ParsedStep[] = []

  lines.forEach((rawLine, lineIdx) => {
    const line = rawLine.trim()
    const lineNum = lineIdx + 1
    if (!line || line.startsWith('#') || line.startsWith('import ') || line.startsWith('from ') || line.startsWith('print(') || line.startsWith('print ')) return

    // Skip pure exploration calls
    if (/^\w+\.(head|tail|info|describe|shape|dtypes|columns)\b/.test(line) && !line.includes('=')) {
      steps.push(makeStep('browse', line, lineNum,
        'Preview/inspect the data — view structure, shape, or sample rows.',
        'Browse', 'Similar to previewing data at any point in a workflow.'
      ))
      return
    }

    let m: RegExpMatchArray | null

    // INPUT: pd.read_csv / read_excel / read_json / read_sql
    if ((m = line.match(/=\s*pd\.read_(csv|excel|json|sql|parquet)\s*\(\s*["']([^"']+)["']/))) {
      steps.push(makeStep('input_data', line, lineNum,
        `Load data from <strong>${m[2]}</strong> (${m[1].toUpperCase()} format) into a dataframe for processing.`,
        'Input Data', `Connects to "${m[2]}" and loads the data.`
      ))
      return
    }
    // read_csv via chaining start
    if ((m = line.match(/pd\.read_(csv|excel|json|parquet)\s*\(\s*["']([^"']+)["']/)) && !line.includes('=')) {
      steps.push(makeStep('input_data', line, lineNum,
        `Load data from <strong>${m[2]}</strong> (${m[1].toUpperCase()} format).`,
        'Input Data', `Reads from "${m[2]}".`
      ))
      return
    }

    // OUTPUT: to_csv / to_excel / to_json
    if ((m = line.match(/\.to_(csv|excel|json|parquet)\s*\(\s*["']([^"']+)["']/))) {
      steps.push(makeStep('output_data', line, lineNum,
        `Export the final results to <strong>${m[2]}</strong> (${m[1].toUpperCase()} format).`,
        'Output Data', `Writes results to "${m[2]}".`
      ))
      return
    }

    // FILTER: df[df['col'] > val] or .query()
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
    // df[df['col'] != 'val'] pattern
    if ((m = line.match(/=\s*\w+\[\s*\w+\[["'](.+?)["']\]\s*(!=|==)\s*["'](.+?)["']\s*\]/))) {
      steps.push(makeStep('filter', line, lineNum,
        `Filter the data: keep rows where <strong>${m[1]}</strong> ${m[2] === '!=' ? 'does not equal' : 'equals'} "${m[3]}".`,
        'Filter', `Condition: [${m[1]}] ${m[2]} "${m[3]}"`
      ))
      return
    }

    // DROPNA
    if (line.includes('.dropna(')) {
      const subsetMatch = line.match(/subset\s*=\s*\[(.+?)\]/)
      const cols = subsetMatch ? subsetMatch[1] : 'all columns'
      steps.push(makeStep('filter', line, lineNum,
        `Remove rows with missing (null/NaN) values${subsetMatch ? ` in columns: <strong>${cols}</strong>` : ''}.`,
        'Filter', 'Removes rows with null values.'
      ))
      return
    }
    // fillna
    if ((m = line.match(/\.fillna\(\s*(.+?)\s*\)/))) {
      steps.push(makeStep('impute', line, lineNum,
        `Replace missing (null) values with <strong>${m[1]}</strong>.`,
        'Imputation', `Fills nulls with ${m[1]}.`
      ))
      return
    }

    // FORMULA: df['new'] = expression or .assign()
    if ((m = line.match(/\w+\[["'](\w+)["']\]\s*=\s*(.+)/)) && !line.match(/\.str\.|\.dt\.|\.astype|pd\.to_/)) {
      steps.push(makeStep('formula', line, lineNum,
        `Create or update column <strong>${m[1]}</strong> with the formula: <code>${m[2].trim()}</code>.`,
        'Formula', `Output column: "${m[1]}" = ${translateExprToAlteryx(m[2].trim())}`
      ))
      return
    }
    if ((m = line.match(/\.assign\(\s*(\w+)\s*=\s*(.+?)\s*[,)]/))) {
      steps.push(makeStep('formula', line, lineNum,
        `Create a new column <strong>${m[1]}</strong> using: <code>${m[2].trim()}</code>.`,
        'Formula', `Creates column "${m[1]}".`
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

    // STRING OPERATIONS
    if (line.includes('.str.strip()') || line.includes('.str.lower()') || line.includes('.str.upper()') || line.includes('.str.title()')) {
      const ops: string[] = []
      if (line.includes('strip')) ops.push('trim whitespace')
      if (line.includes('lower')) ops.push('lowercase')
      if (line.includes('upper')) ops.push('uppercase')
      if (line.includes('title')) ops.push('title case')
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

    // DATETIME
    if (line.includes('pd.to_datetime(') || line.includes('.dt.year') || line.includes('.dt.month') || line.includes('.dt.day') || line.includes('.dt.date') || line.includes('.dt.day_name') || line.includes('.dt.hour')) {
      const parts: string[] = []
      if (line.includes('.dt.year')) parts.push('Year')
      if (line.includes('.dt.month')) parts.push('Month')
      if (line.includes('.dt.day_name')) parts.push('Day of Week')
      else if (line.includes('.dt.day') || line.includes('.dt.date')) parts.push('Date')
      if (line.includes('.dt.hour')) parts.push('Hour')
      if (line.includes('to_datetime') && parts.length === 0) parts.push('datetime')
      steps.push(makeStep('datetime', line, lineNum,
        `${line.includes('to_datetime') && parts.includes('datetime') ? 'Convert a text column to a proper date/time format' : `Extract <strong>${parts.join(', ')}</strong> from a date column`}.`,
        'DateTime', `Extracts: ${parts.join(', ')}.`
      ))
      return
    }

    // TYPE CONVERSION
    if (line.includes('.astype(') || line.includes('pd.to_numeric(')) {
      steps.push(makeStep('type_convert', line, lineNum,
        'Convert column data types (e.g., text to number, number to string).',
        'Select (Change Type)', 'Changes column data types.'
      ))
      return
    }

    // SELECT: df[['col1','col2']] or .drop(columns=[])
    if ((m = line.match(/=\s*\w+\[\s*\[(.+?)\]\s*\]/)) && m[1].includes("'")) {
      steps.push(makeStep('select', line, lineNum,
        `Select specific columns to keep: <strong>${m[1].replace(/["']/g, '')}</strong>. All other columns are removed.`,
        'Select', `Keeps: ${m[1].replace(/["']/g, '')}.`
      ))
      return
    }
    if (line.includes('.drop(') && line.includes('columns')) {
      const colMatch = line.match(/columns\s*=\s*\[(.+?)\]/)
      steps.push(makeStep('select', line, lineNum,
        `Remove columns: <strong>${colMatch ? colMatch[1].replace(/["']/g, '') : '(specified columns)'}</strong> from the data.`,
        'Select', `Drops: ${colMatch ? colMatch[1].replace(/["']/g, '') : 'specified columns'}.`
      ))
      return
    }
    // .rename()
    if (line.includes('.rename(') && line.includes('columns')) {
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

    // SORT
    if ((m = line.match(/\.sort_values\(\s*["']?(\w+)["']?/))) {
      const desc = line.includes('ascending=False') || line.includes('ascending = False')
      steps.push(makeStep('sort', line, lineNum,
        `Sort the data by <strong>${m[1]}</strong> in <strong>${desc ? 'descending' : 'ascending'}</strong> order.`,
        'Sort', `By "${m[1]}", ${desc ? 'descending' : 'ascending'}.`
      ))
      return
    }

    // UNIQUE
    if (line.includes('.drop_duplicates(')) {
      const subMatch = line.match(/subset\s*=\s*\[(.+?)\]/)
      steps.push(makeStep('unique', line, lineNum,
        `Remove duplicate rows${subMatch ? ` based on columns: <strong>${subMatch[1].replace(/["']/g, '')}</strong>` : ''}.`,
        'Unique', `Deduplicates${subMatch ? ` on: ${subMatch[1].replace(/["']/g, '')}` : ''}.`
      ))
      return
    }

    // SAMPLE
    if ((m = line.match(/\.(sample|head|tail)\(\s*(?:n\s*=\s*)?(\d+)?/))) {
      const n = m[2] || '5'
      const type = m[1]
      steps.push(makeStep('sample', line, lineNum,
        `Take a ${type === 'sample' ? 'random sample' : type === 'head' ? 'first' : 'last'} <strong>${n}</strong> rows from the data.`,
        'Sample', `${type === 'sample' ? `Random ${n} records` : `First ${n} records`}.`
      ))
      return
    }

    // SUMMARIZE: .groupby().agg()
    if (line.includes('.groupby(') && (line.includes('.agg(') || line.includes('.sum()') || line.includes('.mean()') || line.includes('.count()') || line.includes('.nunique()'))) {
      const grpMatch = line.match(/\.groupby\(\s*\[?["']?(.+?)["']?\]?\s*\)/)
      const groups = grpMatch ? grpMatch[1].replace(/["'\[\]]/g, '') : '?'
      let aggDesc = 'aggregate'
      if (line.includes('.sum()')) aggDesc = 'sum'
      else if (line.includes('.mean()')) aggDesc = 'average'
      else if (line.includes('.count()')) aggDesc = 'count'
      else if (line.includes('.nunique()')) aggDesc = 'count distinct'
      steps.push(makeStep('summarize', line, lineNum,
        `Group the data by <strong>${groups}</strong> and calculate the <strong>${aggDesc}</strong> of each group.`,
        'Summarize', `Group by: ${groups}. Action: ${aggDesc}.`
      ))
      return
    }
    // groupby alone with .agg on same line
    if (line.includes('.groupby(') && !line.includes('.agg') && !line.includes('.sum') && !line.includes('.mean') && !line.includes('.count')) {
      const grpMatch = line.match(/\.groupby\(\s*\[?["']?(.+?)["']?\]?\s*\)\s*\.agg/)
      if (grpMatch) {
        steps.push(makeStep('summarize', line, lineNum,
          `Group the data by <strong>${grpMatch[1].replace(/["'\[\]]/g, '')}</strong> and aggregate.`,
          'Summarize', `Group by: ${grpMatch[1].replace(/["'\[\]]/g, '')}.`
        ))
        return
      }
    }
    // .value_counts()
    if (line.includes('.value_counts()')) {
      steps.push(makeStep('summarize', line, lineNum,
        'Count the frequency of each unique value — like a quick "group by + count".',
        'Summarize', 'Counts each unique value.'
      ))
      return
    }

    // PIVOT
    if (line.includes('.pivot_table(') || line.includes('.pivot(')) {
      steps.push(makeStep('crosstab', line, lineNum,
        'Create a pivot table — reorganize the data so row values become column headers.',
        'Cross Tab', 'Pivots rows into columns.'
      ))
      return
    }
    // .melt() / .stack() / .unstack()
    if (line.includes('.melt(') || line.includes('.stack()') || line.includes('.unstack()')) {
      steps.push(makeStep('transpose', line, lineNum,
        `Reshape the data — ${line.includes('melt') ? 'unpivot columns into rows (wide to long)' : 'transpose the data structure'}.`,
        'Transpose', 'Unpivots columns into rows.'
      ))
      return
    }

    // JOIN
    if (line.includes('pd.merge(') || line.includes('.merge(') || line.includes('.join(')) {
      const howMatch = line.match(/how\s*=\s*["'](\w+)["']/)
      const onMatch = line.match(/on\s*=\s*["'](\w+)["']/)
      const joinType = howMatch ? howMatch[1] : 'inner'
      steps.push(makeStep('join', line, lineNum,
        `Join (merge) two datasets using a <strong>${joinType}</strong> join${onMatch ? ` on the <strong>${onMatch[1]}</strong> column` : ''}.`,
        'Join', `${joinType} join${onMatch ? ` on "${onMatch[1]}"` : ''}.`
      ))
      return
    }

    // UNION
    if (line.includes('pd.concat(')) {
      steps.push(makeStep('union', line, lineNum,
        'Stack (append) multiple datasets together vertically — combining rows from two or more tables.',
        'Union', 'Stacks rows from multiple datasets.'
      ))
      return
    }

    // REPLACE
    if (line.includes('.replace(') && !line.includes('.str.replace')) {
      steps.push(makeStep('formula', line, lineNum,
        'Replace specific values in the data with new values.',
        'Formula', 'Swaps values using a mapping.'
      ))
      return
    }

    // RESET_INDEX — skip
    if (line.includes('.reset_index(')) return
    // .copy() — skip
    if (line.match(/=\s*\w+\.copy\(\)/)) return
    // Multi-line continuation — skip
    if (line.match(/^\.\s*agg\s*\(/) || line.match(/^\.reset_index/) || line.match(/^\)/) || line.match(/^["']\w+["']\s*:/) || line.match(/^\}\)/) || line.match(/^\s*\)/)) return
  })

  return steps
}
