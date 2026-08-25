import * as notes from '../repositories/notes.repository.js'
import { httpError, idFrom, requireText } from '../utils/request.js'

function optionalTitle(value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw httpError(400, 'title must be a string or null.')
  return value.trim() || null
}

export async function listNotes(_request, response, next) {
  try {
    response.json((await notes.listNotes()).rows)
  } catch (error) {
    next(error)
  }
}

export async function createNote(request, response, next) {
  try {
    const result = await notes.createNote({
      title: optionalTitle(request.body.title),
      content: requireText(request.body.content, 'content'),
    })
    response.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function updateNote(request, response, next) {
  try {
    const id = idFrom(request)
    const updates = {}
    if (Object.hasOwn(request.body, 'title')) updates.title = optionalTitle(request.body.title)
    if (Object.hasOwn(request.body, 'content'))
      updates.content = requireText(request.body.content, 'content')
    const result = await notes.updateNote(id, updates)
    if (!result) throw httpError(400, 'Provide title or content to update.')
    if (!result.rowCount) throw httpError(404, 'Note not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function deleteNote(request, response, next) {
  try {
    const result = await notes.deleteNote(idFrom(request))
    if (!result.rowCount) throw httpError(404, 'Note not found.')
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
