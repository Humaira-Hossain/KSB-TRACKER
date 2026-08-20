import * as catalog from "../repositories/catalog.repository.js";
import { httpError, idFrom } from "../utils/request.js";

export async function listKsbs(_request, response, next) {
  try { response.json((await catalog.listKsbs()).rows); } catch (error) { next(error); }
}

export async function getKsb(request, response, next) {
  try {
    const id = idFrom(request);
    const result = await catalog.getKsb(id);
    if (!result.rowCount) throw httpError(404, "KSB not found.");
    const [criteria, evidence] = await catalog.getKsbDetails(id);
    response.json({ ...result.rows[0], acceptanceCriteria: criteria.rows, evidence: evidence.rows });
  } catch (error) { next(error); }
}

export async function listAcceptanceCriteria(_request, response, next) {
  try { response.json((await catalog.listAcceptanceCriteria()).rows); } catch (error) { next(error); }
}

export async function getAcceptanceCriterion(request, response, next) {
  try {
    const id = idFrom(request);
    const result = await catalog.getAcceptanceCriterion(id);
    if (!result.rowCount) throw httpError(404, "Acceptance criterion not found.");
    const [ksbs, evidence] = await catalog.getAcceptanceCriterionDetails(id);
    response.json({ ...result.rows[0], ksbs: ksbs.rows, evidence: evidence.rows });
  } catch (error) { next(error); }
}

function codeFrom(request) {
  const code = request.params.code?.trim().toUpperCase();
  if (!code || !/^[A-Z]+\d+$/.test(code)) throw httpError(400, "Invalid code.");
  return code;
}

export async function getAcceptanceCriterionEvidenceByCode(request, response, next) {
  try {
    const [criterion, ksbs, evidence] = await catalog.getAcceptanceCriterionEvidenceByCode(codeFrom(request));
    if (!criterion.rowCount) throw httpError(404, "Acceptance criterion not found.");
    response.json({ ...criterion.rows[0], requiredKsbCodes: ksbs.rows.map((ksb) => ksb.code), evidence: evidence.rows });
  } catch (error) { next(error); }
}

export async function getKsbEvidenceByCode(request, response, next) {
  try {
    const [ksb, evidence] = await catalog.getKsbEvidenceByCode(codeFrom(request));
    if (!ksb.rowCount) throw httpError(404, "KSB not found.");
    response.json({ ...ksb.rows[0], evidence: evidence.rows });
  } catch (error) { next(error); }
}
