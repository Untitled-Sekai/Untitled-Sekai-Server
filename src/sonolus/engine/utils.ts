import { fileURLToPath } from 'node:url'

export const resolveEngineResource = (name: string) =>
    fileURLToPath(import.meta.resolve(`../../../lib/sonolus-pjsekai-engine-extended/${name}`))