import { api } from './api'

export function getProgress() {
  return api('/progress')
}
