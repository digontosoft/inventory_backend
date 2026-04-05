/**
 * Lightweight request body validator — no external packages.
 *
 * Usage:
 *   const schema = { email: [rules.required(), rules.email()] };
 *   router.post('/', validate(schema), controller);
 */

const rules = {
  required: (msg) => (val, field) =>
    val === undefined || val === null || val === ''
      ? msg || `${field} is required`
      : null,

  string: (msg) => (val, field) =>
    val !== undefined && typeof val !== 'string'
      ? msg || `${field} must be a string`
      : null,

  number: (msg) => (val, field) =>
    val !== undefined && (typeof val !== 'number' || isNaN(val))
      ? msg || `${field} must be a number`
      : null,

  min: (n, msg) => (val, field) =>
    val !== undefined && String(val).length < n
      ? msg || `${field} must be at least ${n} characters`
      : null,

  max: (n, msg) => (val, field) =>
    val !== undefined && String(val).length > n
      ? msg || `${field} must be at most ${n} characters`
      : null,

  minValue: (n, msg) => (val, field) =>
    val !== undefined && Number(val) < n
      ? msg || `${field} must be at least ${n}`
      : null,

  email: (msg) => (val) =>
    val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      ? msg || 'Invalid email address'
      : null,

  oneOf: (options, msg) => (val, field) =>
    val !== undefined && !options.includes(val)
      ? msg || `${field} must be one of: ${options.join(', ')}`
      : null,
};

/**
 * Returns an Express middleware that validates req.body against the schema.
 * On first error, responds with 400 { success: false, error: "message" }.
 *
 * @param {Record<string, Function[]>} schema
 */
const validate = (schema) => (req, res, next) => {
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const err = rule(req.body[field], field, req.body);
      if (err) {
        return res.status(400).json({ success: false, error: err });
      }
    }
  }
  next();
};

module.exports = { validate, rules };
