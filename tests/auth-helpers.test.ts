import { describe, it, expect } from 'vitest'
import { sanitizeInput } from '../lib/auth-helpers'

describe('auth-helpers', () => {
  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello')
    })

    it('should respect maxLength', () => {
      expect(sanitizeInput('a'.repeat(600), 500)).toHaveLength(500)
    })

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('')
    })
  })
})
