import { Router } from 'express'
import { progress, progressInsights } from '../controllers/progress.controller.js'

const router = Router()
router.get('/progress', progress)
router.get('/progress/insights', progressInsights)

export default router
