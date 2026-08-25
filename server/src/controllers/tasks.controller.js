import * as tasks from '../repositories/tasks.repository.js'
import { httpError, idFrom, requireChoice, requireText, taskStatuses } from '../utils/request.js'

export async function listTasks(_request, response, next) {
  try {
    response.json((await tasks.listTasks()).rows)
  } catch (error) {
    next(error)
  }
}

export async function getTask(request, response, next) {
  try {
    const result = await tasks.getTaskWithEvidence(idFrom(request))
    if (!result.rowCount) throw httpError(404, 'Task not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function createTask(request, response, next) {
  try {
    const status = request.body.status ?? 'draft'
    requireChoice(status, taskStatuses, 'status')
    const result = await tasks.createTask({
      title: requireText(request.body.title, 'title'),
      rawNotes: requireText(request.body.rawNotes, 'rawNotes'),
      status,
    })
    response.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function updateTask(request, response, next) {
  try {
    const id = idFrom(request)
    if (Object.hasOwn(request.body, 'title')) requireText(request.body.title, 'title')
    if (Object.hasOwn(request.body, 'rawNotes')) requireText(request.body.rawNotes, 'rawNotes')
    if (Object.hasOwn(request.body, 'status'))
      requireChoice(request.body.status, taskStatuses, 'status')
    const updates = { ...request.body }
    if (Object.hasOwn(updates, 'rawNotes')) {
      updates.raw_notes = updates.rawNotes
      delete updates.rawNotes
    }
    const result = await tasks.updateTask(id, updates)
    if (!result) throw httpError(400, 'Provide at least one field to update.')
    if (!result.rowCount) throw httpError(404, 'Task not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function completeTask(request, response, next) {
  try {
    const result = await tasks.completeTask(idFrom(request))
    if (!result.rowCount) throw httpError(404, 'Task not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function archiveTask(request, response, next) {
  try {
    const result = await tasks.archiveTask(idFrom(request))
    if (!result.rowCount) throw httpError(404, 'Task not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}
