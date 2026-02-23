# Ophi — Python to Alteryx Translator

Ophi is a web app that translates Python pandas code into visual Alteryx workflow breakdowns. Paste or upload your Python code and instantly see which Alteryx Designer tools correspond to each pandas operation, complete with a visual workflow canvas, a cheat sheet, recommendations, and annotated code view.

**Live app:** [ophi-ai.netlify.app](https://ophi-ai.netlify.app)

## Features

- **Visual workflow canvas** — Connected nodes showing the Alteryx tool equivalent for each pandas operation
- **Cheat sheet view** — Quick-reference mapping between pandas and Alteryx
- **Recommendations** — Pattern-based suggestions for improving your Alteryx workflow
- **Annotated code view** — Your Python code with inline comments showing the Alteryx equivalent
- **File upload** — Drag and drop `.py` or `.ipynb` files (up to 500KB)
- **Sample scripts** — 5 built-in examples to try (Sales Pipeline, ETL Workflow, Data Analysis, Method Chaining, Notebook Style)
- **21 Alteryx tools** mapped across Input/Output, Preparation, Transform, Parse, Join, and Output categories

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/grosz99/ophi.git
   cd ophi
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Commands

```bash
npm run build    # Type-check and build for production
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Tailwind CSS 4
- DOMPurify for HTML sanitization
