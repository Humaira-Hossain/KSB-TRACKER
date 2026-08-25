import { Router } from 'express'
import {
  getAcceptanceCriterion,
  getAcceptanceCriterionEvidenceByCode,
  getKsb,
  getKsbEvidenceByCode,
  listAcceptanceCriteria,
  listKsbs,
} from '../controllers/catalog.controller.js'

const router = Router()

router.get('/ksbs', listKsbs)
router.get('/ksbs/:id', getKsb)
router.get('/ksbs/:code/evidence', getKsbEvidenceByCode)
router.get('/acceptance-criteria', listAcceptanceCriteria)
router.get('/acceptance-criteria/:id', getAcceptanceCriterion)
router.get('/acceptance-criteria/:code/evidence', getAcceptanceCriterionEvidenceByCode)

export default router
