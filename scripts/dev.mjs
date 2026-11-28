import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BACKEND_DIR = path.join(ROOT_DIR, 'backend')
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend')

function startProcess(label, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${label}] exited with code ${code}`)
    }
  })

  return child
}

const backend = startProcess(
  'backend',
  'python',
  ['-m', 'uvicorn', 'api.main:app', '--reload', '--port', '8000'],
  BACKEND_DIR,
)

const frontend = startProcess(
  'frontend',
  'pnpm',
  ['dev'],
  FRONTEND_DIR,
)

function shutdown() {
  backend.kill()
  frontend.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

