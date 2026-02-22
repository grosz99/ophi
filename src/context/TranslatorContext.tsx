import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { TranslatorState, TranslatorAction } from '@/types'

const initialState: TranslatorState = {
  code: '',
  steps: [],
  selectedStep: -1,
  activeTab: 'workflow',
  highlightedLines: [],
  analysisMode: 'regex',
  isAnalyzing: false,
  analysisError: null,
}

function reducer(state: TranslatorState, action: TranslatorAction): TranslatorState {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload }
    case 'SET_STEPS':
      return { ...state, steps: action.payload }
    case 'SELECT_STEP':
      return { ...state, selectedStep: action.payload }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload }
    case 'SET_HIGHLIGHTED_LINES':
      return { ...state, highlightedLines: action.payload }
    case 'SET_ANALYSIS_MODE':
      return { ...state, analysisMode: action.payload }
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload }
    case 'SET_ERROR':
      return { ...state, analysisError: action.payload }
    case 'TRANSLATE':
      return {
        ...state,
        steps: action.payload.steps,
        highlightedLines: action.payload.highlightedLines,
        selectedStep: -1,
        analysisError: null,
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const TranslatorContext = createContext<TranslatorState>(initialState)
const TranslatorDispatchContext = createContext<Dispatch<TranslatorAction>>(() => {})

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <TranslatorContext.Provider value={state}>
      <TranslatorDispatchContext.Provider value={dispatch}>
        {children}
      </TranslatorDispatchContext.Provider>
    </TranslatorContext.Provider>
  )
}

export function useTranslator() {
  return useContext(TranslatorContext)
}

export function useTranslatorDispatch() {
  return useContext(TranslatorDispatchContext)
}
