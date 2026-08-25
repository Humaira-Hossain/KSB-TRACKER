export const taskStatuses = new Set(['draft', 'ready_for_review', 'completed', 'archived'])
export const evidenceStatuses = new Set(['draft', 'ai_generated', 'awaiting_review', 'approved'])
export const reviewStatuses = new Set(['suggested', 'accepted', 'rejected'])

export function idFrom(request, name = 'id') {
  const id = Number(request.params[name])
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `Invalid ${name}.`)
  return id
}

export function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw httpError(400, `${field} is required.`)
  return value.trim()
}

export function requireChoice(value, choices, field) {
  if (!choices.has(value)) throw httpError(400, `Invalid ${field}.`)
  return value
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status })
}
