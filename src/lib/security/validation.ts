const MAX_FILE_SIZE = 512 * 1024 // 500KB
const ALLOWED_EXTENSIONS = ['.py', '.ipynb']

interface ValidationResult {
  valid: boolean
  error?: string
  content?: string
}

export async function validateAndReadFile(file: File): Promise<ValidationResult> {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file type "${ext}". Only .py and .ipynb files are accepted.` }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024).toFixed(0)}KB). Maximum is 500KB.` }
  }

  try {
    const content = await readAsText(file)

    if (content.includes('\0')) {
      return { valid: false, error: 'File contains invalid characters.' }
    }

    if (content.length === 0) {
      return { valid: false, error: 'File is empty.' }
    }

    if (ext === '.ipynb') {
      return parseNotebook(content)
    }

    return { valid: true, content }
  } catch {
    return { valid: false, error: 'Failed to read file.' }
  }
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsText(file)
  })
}

function parseNotebook(content: string): ValidationResult {
  try {
    const nb = JSON.parse(content)
    if (!nb.cells || !Array.isArray(nb.cells)) {
      return { valid: false, error: 'Invalid notebook: missing cells array.' }
    }

    const codeCells = nb.cells
      .filter((c: { cell_type: string }) => c.cell_type === 'code')
      .map((c: { source: string | string[] }, i: number) => {
        const src = Array.isArray(c.source) ? c.source.join('') : (c.source || '')
        return `# Cell ${i + 1}\n${src}`
      })

    const extracted = codeCells.join('\n\n')
    return { valid: true, content: extracted }
  } catch {
    return { valid: false, error: 'Invalid notebook: not valid JSON.' }
  }
}

export function validateCodeInput(code: string): string | null {
  if (code.length > MAX_FILE_SIZE) {
    return 'Code input too large. Maximum 500KB.'
  }
  if (code.includes('\0')) {
    return 'Input contains invalid characters.'
  }
  return null
}
