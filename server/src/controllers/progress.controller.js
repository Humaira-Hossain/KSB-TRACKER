import { getProgress, getProgressInsights } from '../services/progress.service.js'

export async function progress(_request, response, next) {
  try {
    response.json((await getProgress()).rows[0])
  } catch (error) {
    next(error)
  }
}

export async function progressInsights(_request, response, next) {
  try {
    response.json(await getProgressInsights())
  } catch (error) {
    next(error)
  }
}
