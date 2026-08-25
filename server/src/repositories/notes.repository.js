import { pool } from '../db.js'

export function listNotes() {
  return pool.query('SELECT * FROM notes ORDER BY created_at DESC')
}

export function createNote({ title, content }) {
  return pool.query('INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *', [
    title,
    content,
  ])
}

export function updateNote(id, updates) {
  const fields = ['title', 'content'].filter((field) => Object.hasOwn(updates, field))
  if (!fields.length) return null
  const values = fields.map((field) => updates[field])
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`)
  values.push(id)
  return pool.query(
    `UPDATE notes SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  )
}

export function deleteNote(id) {
  return pool.query('DELETE FROM notes WHERE id = $1 RETURNING id', [id])
}
