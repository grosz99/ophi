/**
 * Converts the Playwright .webm recording to a GIF using the npm-bundled ffmpeg.
 * Usage: node e2e/convert-to-gif.mjs <input.webm> [output.gif]
 */
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path

const input = process.argv[2]
const output = process.argv[3] || path.join('screenshots', 'ophi-demo.gif')

if (!input || !existsSync(input)) {
  console.error('Usage: node e2e/convert-to-gif.mjs <path-to-video.webm> [output.gif]')
  console.error('  Input file not found:', input || '(none)')
  process.exit(1)
}

console.log(`Converting ${input} → ${output}`)
console.log(`Using ffmpeg at: ${ffmpegPath}`)

// Two-pass approach: generate palette first for better quality, then encode GIF
const palette = path.join(path.dirname(output), '_palette.png')

try {
  // Pass 1: generate optimal palette
  execSync(
    `"${ffmpegPath}" -y -i "${input}" -vf "fps=12,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff" "${palette}"`,
    { stdio: 'inherit' }
  )

  // Pass 2: encode GIF using palette
  execSync(
    `"${ffmpegPath}" -y -i "${input}" -i "${palette}" -lavfi "fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" "${output}"`,
    { stdio: 'inherit' }
  )

  // Clean up palette
  execSync(`del "${palette.replace(/\//g, '\\')}" 2>nul`, { shell: 'cmd.exe', stdio: 'ignore' })

  console.log(`\nDone! GIF saved to: ${output}`)
} catch (err) {
  console.error('Conversion failed:', err.message)
  process.exit(1)
}
