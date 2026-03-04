import { ZodError } from 'zod'

export const validate = (schema) => (req, res, next) => {
  try {
    // Coerce numeric strings in body to numbers for Zod
    const parsed = schema.parse(req.body)
    req.body = parsed
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }))
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }
    next(err)
  }
}
