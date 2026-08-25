import { Router } from 'express'
import {
  createAcceptanceCriterionLink,
  createKsbLink,
  generateEvidence,
  reviewAcceptanceCriterionLink,
  reviewKsbLink,
  updateEvidence,
} from '../controllers/evidence.controller.js'

const router = Router()

router.patch('/evidence/:id', updateEvidence)
router.post('/evidence/:id/generate', generateEvidence)
router.post('/evidence/:id/ksbs', createKsbLink)
router.post('/evidence/:id/acceptance-criteria', createAcceptanceCriterionLink)
router.put('/evidence/:id/ksbs/:ksbId/review', reviewKsbLink)
router.put('/evidence/:id/acceptance-criteria/:acId/review', reviewAcceptanceCriterionLink)

export default router
