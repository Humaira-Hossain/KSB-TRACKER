import { getProgress } from '../services/progress.service.js'

export async function progress(_request, response, next) {
  try {
    response.json((await getProgress()).rows[0])
  } catch (error) {
    next(error)
  }
}
