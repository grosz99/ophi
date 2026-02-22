export type ToolKey =
  | 'input_data' | 'output_data' | 'filter' | 'formula' | 'select'
  | 'sort' | 'unique' | 'sample' | 'cleanse' | 'impute'
  | 'summarize' | 'crosstab' | 'transpose' | 'join' | 'union'
  | 'text_to_cols' | 'regex' | 'datetime' | 'multi_row' | 'browse'
  | 'type_convert'

export type ToolCategory = 'input' | 'prep' | 'transform' | 'parse' | 'join' | 'output'

export interface ToolDefinition {
  name: string
  icon: string
  cat: ToolCategory
  color: string
}

export interface ParsedStep {
  toolKey: ToolKey
  tool: string
  icon: string
  cat: ToolCategory
  color: string
  code: string
  line: number
  explain: string
  alteryxTool: string
  alteryxDetail: string
}

export type ViewTab = 'workflow' | 'cheatsheet' | 'recommendations' | 'annotated'
export type AnalysisMode = 'regex' | 'claude'

export interface TranslatorState {
  code: string
  steps: ParsedStep[]
  selectedStep: number
  activeTab: ViewTab
  highlightedLines: number[]
  analysisMode: AnalysisMode
  isAnalyzing: boolean
  analysisError: string | null
}

export type TranslatorAction =
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_STEPS'; payload: ParsedStep[] }
  | { type: 'SELECT_STEP'; payload: number }
  | { type: 'SET_TAB'; payload: ViewTab }
  | { type: 'SET_HIGHLIGHTED_LINES'; payload: number[] }
  | { type: 'SET_ANALYSIS_MODE'; payload: AnalysisMode }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TRANSLATE'; payload: { steps: ParsedStep[]; highlightedLines: number[] } }
  | { type: 'RESET' }
