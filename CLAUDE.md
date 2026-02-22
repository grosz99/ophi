# Ophi — Python to Alteryx Translator

## Project Overview

**Ophi** is a React + TypeScript web app that parses Python pandas code and translates it into visual Alteryx workflow breakdowns. It helps users who know Python understand how the same data operations map to Alteryx Designer tools.

**Live deployment target:** Netlify
**Tech stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, DOMPurify
**Branding:** Duke blue theme (`#003087`)

## Architecture

```
src/
├── App.tsx                          # Main layout: Header | CodeInput | Divider | Output | Footer
├── main.tsx                         # React root
├── index.css                        # Tailwind v4 theme + custom CSS
├── context/TranslatorContext.tsx     # useReducer state management
├── types/index.ts                   # All TS interfaces (ParsedStep, ToolKey, ViewTab, etc.)
├── lib/
│   ├── parser/
│   │   ├── regexParser.ts           # Core: parseCode() — regex-based pandas → Alteryx mapping
│   │   ├── toolDefinitions.ts       # 21 Alteryx tools with names, icons, categories, colors
│   │   ├── expressionTranslator.ts  # Pandas expression → Alteryx formula syntax
│   │   └── index.ts
│   ├── generators/
│   │   ├── annotatedCodeGenerator.ts  # Inserts Alteryx-equivalent comments into Python code
│   │   ├── recommendationsGenerator.ts # Pattern-based suggestions (warnings, improvements)
│   │   └── index.ts
│   ├── security/
│   │   ├── sanitize.ts              # DOMPurify wrappers (sanitizeHTML, stripHTML)
│   │   └── validation.ts            # File upload + code input validation (500KB, .py/.ipynb)
│   └── samples/index.ts             # 5 pre-loaded sample scripts
└── components/
    ├── layout/          Header.tsx, Footer.tsx
    ├── code-input/      CodeInputPanel.tsx, CodeEditor.tsx, FileUpload.tsx, SampleSelector.tsx
    ├── views/           OutputPanel.tsx, ViewTabs.tsx, CheatSheetView.tsx, RecommendationsView.tsx, AnnotatedCodeView.tsx
    ├── workflow/        WorkflowCanvas.tsx, WorkflowNode.tsx, NodeDetail.tsx, NodeConnector.tsx, EmptyState.tsx
    └── ui/              Toast.tsx
```

## Current State (as of Feb 2026)

### What's Working
- Regex-based parser detects ~50+ pandas operations and maps to 21 Alteryx tools
- Visual workflow canvas with connected nodes (vertical flow)
- 4 output views: Workflow, Cheat Sheet, Recommendations, Annotated Code
- 5 sample scripts (Sales Pipeline, ETL Workflow, Data Analysis, Method Chaining, Notebook Style)
- File upload (.py, .ipynb) with validation
- Toast notifications, security (DOMPurify, CSP headers)
- Build succeeds (`dist/` exists)

### What Needs To Be Done

#### 1. FIX: Tool Category Colors (PRIORITY)
The current colors in `toolDefinitions.ts` and `index.css` do NOT match actual Alteryx Designer palette colors.

**Current (wrong) → Correct Alteryx colors:**

| Category      | Current in Code          | Actual Alteryx Color        |
|---------------|-------------------------|-----------------------------|
| **Input/Output** | `#2563eb` (blue) / `#0d9488` (teal) | `#4AB47B` (green) — Alteryx I/O tools are GREEN |
| **Preparation**  | `#d97706` (amber)      | `#6BAED6` / `#4A90D9` (blue) — Prep tools are BLUE |
| **Transform**    | `#059669` (green)      | `#D65B5B` / `#CC4B4B` (red) — Transform tools are RED |
| **Parse**        | `#7c3aed` (purple)     | `#E8943A` (orange) — Parse tools are ORANGE |
| **Join**         | `#ea580c` (orange)     | `#D4A843` / `#C9A83B` (gold/yellow) — Join tools are GOLD |
| **Output**       | `#0d9488` (teal)       | Same as Input: `#4AB47B` (green) |

**Files to update:**
- `src/lib/parser/toolDefinitions.ts` — color values per tool
- `src/index.css` — CSS custom properties `--color-cat-*`

**Note:** Alteryx does NOT publish official hex codes. The above are approximations from community resources and visual inspection. Consider verifying against a real Alteryx Designer screenshot if available.

#### 2. TODO: Anthropic (Claude) API Integration
The `analysisMode: 'claude'` exists in state but is not implemented.

**Plan:**
- Create a Netlify serverless function at `netlify/functions/analyze.ts`
- Function receives Python code, calls Claude API for enhanced analysis
- Returns richer explanations, better Alteryx mapping, and smarter recommendations
- Frontend already has `SET_ANALYSIS_MODE`, `SET_ANALYZING`, `SET_ERROR` actions ready
- API key goes in Netlify env vars (see `.env.example`: `ANTHROPIC_API_KEY`)
- Add a toggle in the UI to switch between regex (fast/free) and Claude (richer/API) modes

**What Claude integration would add:**
- Better handling of complex multi-line pandas chains
- More accurate Alteryx tool mapping for edge cases
- Natural language explanations of what the code does
- Smarter recommendations tailored to the specific code

#### 3. TODO: Deploy to Netlify
- `netlify.toml` is already configured (build command, publish dir, security headers, SPA routing)
- Set `ANTHROPIC_API_KEY` in Netlify dashboard environment variables
- Connect GitHub repo or deploy via `netlify deploy --prod`
- CSP header in `netlify.toml` may need updating if Claude API calls go to `api.anthropic.com`

#### 4. Unused Dependencies
- `docx` (v9.5) and `jspdf` (v4.2) are installed but not used — intended for PDF/DOCX export of workflows
- `UPSTASH_REDIS_REST_URL/TOKEN` in `.env.example` — intended for rate limiting API calls

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # TypeScript check + production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

## Key Design Decisions
- **Regex parsing over AST**: Simpler, faster, no Python runtime needed — works client-side
- **No routing library**: Single-page app with tab-based views, no need for React Router
- **DOMPurify for all HTML**: Explanations use `<strong>`, `<code>` tags — always sanitized before rendering
- **Module-level toast**: `showToast()` uses a global setter so any component can trigger toasts
- **Duke blue branding**: `#003087` primary, gradient text/buttons throughout

## State Management Pattern
React Context + useReducer. Two hooks:
- `useTranslator()` — read state
- `useTranslatorDispatch()` — dispatch actions

Key actions: `SET_CODE`, `TRANSLATE`, `SELECT_STEP`, `SET_TAB`, `SET_ANALYSIS_MODE`, `RESET`

## Security Notes
- File uploads validated: 500KB max, .py/.ipynb only, null char detection
- All HTML in explanations sanitized via DOMPurify (allowed: b, i, em, strong, code, span, br)
- Strict CSP headers in netlify.toml
- API keys NEVER committed — use Netlify env vars
