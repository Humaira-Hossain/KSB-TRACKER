import * as catalog from '../repositories/catalog.repository.js'
import * as evidence from '../repositories/evidence.repository.js'
import * as tasks from '../repositories/tasks.repository.js'
import { generateEvidenceFromNotes } from '../services/ai.service.js'
import {
  evidenceStatuses,
  httpError,
  idFrom,
  requireChoice,
  requireText,
  reviewStatuses,
} from '../utils/request.js'

async function requireTask(id) {
  if (!(await tasks.getTask(id)).rowCount) throw httpError(404, 'Task not found.')
}

async function requireEvidenceEditable(id) {
  const result = await evidence.getEvidenceTaskStatus(id)
  if (!result.rowCount) throw httpError(404, 'Evidence not found.')
  if (result.rows[0].task_status === 'completed')
    throw httpError(409, 'Reopen this task before changing its evidence.')
}

export async function listEvidenceForTask(request, response, next) {
  try {
    const taskId = idFrom(request, 'taskId')
    await requireTask(taskId)
    response.json((await evidence.listEvidenceForTask(taskId)).rows)
  } catch (error) {
    next(error)
  }
}

export async function createEvidence(request, response, next) {
  try {
    const taskId = idFrom(request, 'taskId')
    await requireTask(taskId)
    if ((await tasks.getTask(taskId)).rows[0].status === 'completed')
      throw httpError(409, 'Reopen this task before changing its evidence.')
    const status = request.body.status ?? 'draft'
    requireChoice(status, evidenceStatuses, 'status')
    const result = await evidence.createEvidence(taskId, {
      ...request.body,
      title: requireText(request.body.title, 'title'),
      status,
    })
    response.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function updateEvidence(request, response, next) {
  try {
    const id = idFrom(request)
    await requireEvidenceEditable(id)
    if (Object.hasOwn(request.body, 'title')) requireText(request.body.title, 'title')
    if (Object.hasOwn(request.body, 'status'))
      requireChoice(request.body.status, evidenceStatuses, 'status')
    const updates = { ...request.body }
    for (const [apiField, databaseField] of Object.entries({
      rawNotes: 'raw_notes',
      aiGenerated: 'ai_generated',
      userReviewed: 'user_reviewed',
      reviewedAt: 'reviewed_at',
    })) {
      if (Object.hasOwn(updates, apiField)) {
        updates[databaseField] = updates[apiField]
        delete updates[apiField]
      }
    }
    const result = await evidence.updateEvidence(id, updates)
    if (!result) throw httpError(400, 'Provide at least one field to update.')
    if (!result.rowCount) throw httpError(404, 'Evidence not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function deleteEvidence(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    await requireEvidenceEditable(evidenceId)
    const result = await evidence.deleteEvidence(evidenceId)
    if (!result.rowCount) throw httpError(404, 'Evidence not found.')
    response.status(204).end()
  } catch (error) {
    next(error)
  }
}

export async function approveEvidence(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    await requireEvidenceEditable(evidenceId)
    const result = await evidence.approveEvidence(evidenceId)
    if (!result.rowCount)
      throw httpError(409, 'Review all suggested KSBs and acceptance criteria before approving.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function generateEvidence(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    await requireEvidenceEditable(evidenceId)
    const evidenceResult = await evidence.getEvidenceForGeneration(evidenceId)
    if (!evidenceResult.rowCount) throw httpError(404, 'Evidence not found.')
    const sourceEvidence = evidenceResult.rows[0]
    if (sourceEvidence.ai_generated)
      throw httpError(409, 'STAR has already been generated for this evidence.')
    if (
      sourceEvidence.task_id &&
      (await evidence.getGeneratedEvidenceForTask(sourceEvidence.task_id)).rowCount
    ) {
      throw httpError(
        409,
        'STAR has already been generated for this task. Edit the existing STAR evidence instead.',
      )
    }
    const rawNotes = sourceEvidence.raw_notes?.trim()
    if (!rawNotes)
      throw httpError(400, 'Evidence must contain raw_notes before it can be generated.')

    const [ksbs, acceptanceCriteria] = await catalog.getGenerationCatalogue()
    const generated = await generateEvidenceFromNotes({
      rawNotes,
      ksbs: ksbs.rows,
      acceptanceCriteria: acceptanceCriteria.rows,
    })
    const ksbByCode = new Map(ksbs.rows.map((ksb) => [ksb.code, ksb]))
    const acByCode = new Map(acceptanceCriteria.rows.map((ac) => [ac.code, ac]))
    const suggestions = {
      ksbs: generated.ksbSuggestions.map((suggestion) => ({
        ...suggestion,
        id: ksbByCode.get(suggestion.code).id,
      })),
      acceptanceCriteria: generated.acSuggestions.map((suggestion) => ({
        ...suggestion,
        id: acByCode.get(suggestion.code).id,
      })),
    }
    const savedEvidence = await evidence.saveGeneratedEvidence(evidenceId, generated, suggestions)
    response.json({
      evidence: savedEvidence,
      suggestions: {
        ksbs: suggestions.ksbs.map(({ id, ...suggestion }) => ({
          ...suggestion,
          ksbId: id,
          reviewStatus: 'suggested',
        })),
        acceptanceCriteria: suggestions.acceptanceCriteria.map(({ id, ...suggestion }) => ({
          ...suggestion,
          acceptanceCriterionId: id,
          reviewStatus: 'suggested',
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function createKsbLink(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    const ksbId = Number(request.body.ksbId)
    if (!Number.isSafeInteger(ksbId) || ksbId < 1) throw httpError(400, 'ksbId is required.')
    await requireEvidenceEditable(evidenceId)
    if (!(await catalog.getKsb(ksbId)).rowCount) throw httpError(404, 'KSB not found.')
    const suggestedBy = request.body.suggestedBy ?? 'user'
    if (!['ai', 'user'].includes(suggestedBy)) throw httpError(400, 'Invalid suggestedBy.')
    const reviewStatus =
      request.body.reviewStatus ?? (suggestedBy === 'ai' ? 'suggested' : 'accepted')
    requireChoice(reviewStatus, reviewStatuses, 'reviewStatus')
    if (suggestedBy === 'ai' && reviewStatus !== 'suggested')
      throw httpError(400, 'AI links must remain suggestions until you review them.')
    response.status(201).json(
      (
        await evidence.createKsbLink(evidenceId, ksbId, {
          aiConfidence: request.body.aiConfidence ?? null,
          suggestedBy,
          reviewStatus,
        })
      ).rows[0],
    )
  } catch (error) {
    next(error)
  }
}

export async function createAcceptanceCriterionLink(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    const acId = Number(request.body.acceptanceCriterionId)
    if (!Number.isSafeInteger(acId) || acId < 1)
      throw httpError(400, 'acceptanceCriterionId is required.')
    await requireEvidenceEditable(evidenceId)
    if (!(await catalog.getAcceptanceCriterion(acId)).rowCount)
      throw httpError(404, 'Acceptance criterion not found.')
    const suggestedBy = request.body.suggestedBy ?? 'user'
    if (!['ai', 'user'].includes(suggestedBy)) throw httpError(400, 'Invalid suggestedBy.')
    const reviewStatus =
      request.body.reviewStatus ?? (suggestedBy === 'ai' ? 'suggested' : 'accepted')
    requireChoice(reviewStatus, reviewStatuses, 'reviewStatus')
    const aiSuggestsComplete = request.body.aiSuggestsComplete ?? false
    if (typeof aiSuggestsComplete !== 'boolean')
      throw httpError(400, 'aiSuggestsComplete must be true or false.')
    if (
      (suggestedBy === 'ai' && reviewStatus !== 'suggested') ||
      (aiSuggestsComplete && suggestedBy !== 'ai')
    )
      throw httpError(
        400,
        'Only an AI suggestion can recommend AC completion, and it must be reviewed by you.',
      )
    response.status(201).json(
      (
        await evidence.createAcceptanceCriterionLink(evidenceId, acId, {
          aiConfidence: request.body.aiConfidence ?? null,
          suggestedBy,
          reviewStatus,
          aiSuggestsComplete,
          aiCompletionRationale: request.body.aiCompletionRationale ?? null,
        })
      ).rows[0],
    )
  } catch (error) {
    next(error)
  }
}

export async function reviewKsbLink(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    await requireEvidenceEditable(evidenceId)
    const result = await evidence.reviewKsbLink(
      evidenceId,
      idFrom(request, 'ksbId'),
      requireChoice(request.body.reviewStatus, reviewStatuses, 'reviewStatus'),
    )
    if (!result.rowCount) throw httpError(404, 'Evidence/KSB link not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export async function reviewAcceptanceCriterionLink(request, response, next) {
  try {
    const evidenceId = idFrom(request)
    await requireEvidenceEditable(evidenceId)
    const result = await evidence.reviewAcceptanceCriterionLink(
      evidenceId,
      idFrom(request, 'acId'),
      requireChoice(request.body.reviewStatus, reviewStatuses, 'reviewStatus'),
    )
    if (!result.rowCount) throw httpError(404, 'Evidence/AC link not found.')
    response.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}
