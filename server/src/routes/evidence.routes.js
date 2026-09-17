import { Router } from 'express'
import {
  approveEvidence,
  createAcceptanceCriterionLink,
  createKsbLink,
  deleteEvidence,
  generateEvidence,
  reviewAcceptanceCriterionLink,
  reviewKsbLink,
  updateEvidence,
} from '../controllers/evidence.controller.js'

const router = Router()

router.patch('/evidence/:id', updateEvidence)
router.delete('/evidence/:id', deleteEvidence)
router.post('/evidence/:id/approve', approveEvidence)
router.post('/evidence/:id/generate', generateEvidence)
router.post('/evidence/:id/ksbs', createKsbLink)
router.post('/evidence/:id/acceptance-criteria', createAcceptanceCriterionLink)
router.put('/evidence/:id/ksbs/:ksbId/review', reviewKsbLink)
router.put('/evidence/:id/acceptance-criteria/:acId/review', reviewAcceptanceCriterionLink)

export default router
