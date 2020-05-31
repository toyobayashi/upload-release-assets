/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { promisify } from 'util'
import * as G from 'glob'

export const glob = promisify(G)

export function isGlob (str: string): boolean {
  const chars: Record<string, string> = { '{': '}', '(': ')', '[': ']' }
  /* eslint-disable-next-line max-len */
  const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/

  if (str === '') {
    return false
  }

  let match: RegExpExecArray | null

  while ((match = regex.exec(str))) {
    if (match[2]) return true
    let idx = match.index + match[0].length

    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1]
    const close = open ? chars[open] : null
    if (open && close) {
      const n = str.indexOf(close, idx)
      if (n !== -1) {
        idx = n + 1
      }
    }

    str = str.slice(idx)
  }

  return false
}

/**
 * @param {string} str
 * @returns {string[]}
 */
export function str2arr (str: string): string[] {
  const arr = str.split(';').map(s => s.trim().split(/\r?\n/).map(ss => ss.trim()))
  const flatarr = arr.reduce((acc, val) => acc.concat(val), [])
  return flatarr.filter(s => (s !== ''))
}
