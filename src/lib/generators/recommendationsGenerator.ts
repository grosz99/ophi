import type { ParsedStep } from '@/types'

export interface Recommendation {
  severity: 'info' | 'warning' | 'improvement'
  title: string
  description: string
  relatedStep?: number // index into steps array
}

/**
 * Generate static, pattern-based recommendations from parsed steps.
 * These work without any API call — purely regex-driven analysis.
 */
export function generateRecommendations(code: string, steps: ParsedStep[]): Recommendation[] {
  const recs: Recommendation[] = []

  // No steps detected
  if (steps.length === 0) return recs

  // Check for missing output
  const hasOutput = steps.some(s => s.toolKey === 'output_data')
  if (!hasOutput) {
    recs.push({
      severity: 'info',
      title: 'No output step detected',
      description: 'This script doesn\'t write results to a file. Consider adding a .to_csv() or .to_excel() call so results can be shared or loaded into downstream tools.',
    })
  }

  // Check for chained operations that could benefit from intermediate validation
  if (steps.length > 8) {
    recs.push({
      severity: 'improvement',
      title: 'Complex pipeline — consider checkpoints',
      description: `This script has ${steps.length} transformation steps. For long pipelines, inserting intermediate .to_csv() saves or print(df.shape) checks helps catch data issues early.`,
    })
  }

  // Check for filter before join (performance hint)
  const filterIdx = steps.findIndex(s => s.toolKey === 'filter')
  const joinIdx = steps.findIndex(s => s.toolKey === 'join')
  if (joinIdx >= 0 && (filterIdx < 0 || filterIdx > joinIdx)) {
    recs.push({
      severity: 'improvement',
      title: 'Filter before joining for better performance',
      description: 'Filtering data before a join reduces the number of rows being matched, which can significantly speed up large merges. Move filter steps above join steps where possible.',
      relatedStep: joinIdx,
    })
  }

  // Check for dropna without specifying subset
  const broadDropna = steps.find(s =>
    s.toolKey === 'filter' && s.code.includes('.dropna()') && !s.code.includes('subset')
  )
  if (broadDropna) {
    recs.push({
      severity: 'warning',
      title: 'dropna() without subset may remove too many rows',
      description: 'Using .dropna() without specifying a subset= parameter drops any row with ANY missing value across all columns. This can silently remove valid data. Specify which columns matter: df.dropna(subset=["col1", "col2"]).',
      relatedStep: steps.indexOf(broadDropna),
    })
  }

  // Check for hardcoded file paths
  const inputSteps = steps.filter(s => s.toolKey === 'input_data')
  if (inputSteps.length > 0) {
    const hasHardcodedPath = inputSteps.some(s => !s.code.includes('os.') && !s.code.includes('Path('))
    if (hasHardcodedPath) {
      recs.push({
        severity: 'info',
        title: 'Consider using configurable file paths',
        description: 'Hardcoded file paths (e.g., "sales.csv") make scripts brittle. Consider using os.path.join() or pathlib.Path, or accept file paths as function arguments for better reusability.',
        relatedStep: steps.indexOf(inputSteps[0]),
      })
    }
  }

  // Check for multiple sequential groupby operations
  const summarizeSteps = steps.filter(s => s.toolKey === 'summarize')
  if (summarizeSteps.length > 1) {
    recs.push({
      severity: 'improvement',
      title: 'Multiple aggregations detected',
      description: `This script performs ${summarizeSteps.length} separate groupby operations. If they group by the same columns, consider combining them into a single .agg() call with multiple aggregation functions for better performance.`,
    })
  }

  // Check for sort that may not be needed before output
  const sortSteps = steps.filter(s => s.toolKey === 'sort')
  const lastStep = steps[steps.length - 1]
  if (sortSteps.length > 1 && lastStep?.toolKey !== 'sort') {
    recs.push({
      severity: 'info',
      title: 'Multiple sorts — only the final order matters',
      description: 'This script sorts the data multiple times. Intermediate sorts may be unnecessary if the data gets re-sorted later. Each sort adds processing time on large datasets.',
    })
  }

  // Check for type conversion after operations (common error pattern)
  const typeConvertIdx = steps.findIndex(s => s.toolKey === 'type_convert')
  const formulaBeforeType = steps.findIndex((s, i) => s.toolKey === 'formula' && i > typeConvertIdx && typeConvertIdx >= 0)
  if (typeConvertIdx >= 0 && formulaBeforeType >= 0) {
    recs.push({
      severity: 'info',
      title: 'Type conversion placement',
      description: 'Data type conversions (astype, to_numeric) are most reliable when done early in the pipeline, before calculations. This prevents type mismatch errors in formula steps.',
    })
  }

  // Check for missing deduplication before join
  if (joinIdx >= 0) {
    const hasUniqueBeforeJoin = steps.some((s, i) => s.toolKey === 'unique' && i < joinIdx)
    if (!hasUniqueBeforeJoin) {
      recs.push({
        severity: 'info',
        title: 'Consider deduplicating before joins',
        description: 'Joining on columns with duplicate values can create unexpected row multiplication. If your join key should be unique, add a .drop_duplicates() step before the merge.',
        relatedStep: joinIdx,
      })
    }
  }

  // General best practice
  if (!code.includes('def ') && !code.includes('class ') && steps.length > 5) {
    recs.push({
      severity: 'improvement',
      title: 'Wrap logic in a function for reusability',
      description: 'This script runs as top-level code. Wrapping the transformation logic in a function (e.g., def transform_data(input_path, output_path)) makes it easier to test, reuse, and integrate into larger systems.',
    })
  }

  return recs
}
