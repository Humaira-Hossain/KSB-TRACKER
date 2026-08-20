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
