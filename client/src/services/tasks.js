import { api } from './api'

export function getTasks() {
  return api('/tasks')
}

export function getTask(taskId) {
  return api(`/tasks/${taskId}`)
}

export function createTask(task) {
  return api('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  })
}

export function updateTask(taskId, updates) {
  return api(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function archiveTask(taskId) {
  return api(`/tasks/${taskId}`, { method: 'DELETE' })
}
