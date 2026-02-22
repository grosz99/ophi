/** Translate a pandas expression into an Alteryx-style expression */
export function translateExprToAlteryx(expr: string): string {
  return expr
    .replace(/df\[["'](\w+)["']\]/g, '[$1]')
    .replace(/["'](\w+)["']/g, '[$1]')
    .replace(/lambda\s+\w+:\s*/g, '')
    .replace(/\bx\[["'](\w+)["']\]/g, '[$1]')
}
