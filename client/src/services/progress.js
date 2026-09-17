import { api } from './api'

export function getProgress() {
  return api('/progress')
}

export function getProgressInsights() {
  return api('/progress/insights')
}
