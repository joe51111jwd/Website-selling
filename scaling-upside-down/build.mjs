// Copies the homepage options (site/) into dist/ for the Vercel preview of this branch.
import { cpSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
cpSync('site', 'dist', { recursive: true })
console.log('copied site/ to dist/')
