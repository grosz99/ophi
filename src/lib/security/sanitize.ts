import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'code', 'span', 'br']
const ALLOWED_ATTR = ['class']

/** Sanitize HTML that may contain formatting tags from the parser */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

/** Strip ALL HTML — returns pure text */
export function stripHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}
