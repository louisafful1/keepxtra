import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { qualityInspectionService, type RequestMeta } from '../services/qualityInspection.service'
import type { AssignInspectorInput, QualityInspectionListQuery, SubmitInspectionInput } from '../validators/qualityInspection.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const listQualityInspections = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as QualityInspectionListQuery
  const { data, meta } = await qualityInspectionService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getQualityInspectionStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await qualityInspectionService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getQualityInspectionById = asyncHandler(async (req: Request, res: Response) => {
  const inspection = await qualityInspectionService.getById(paramId(req))
  ApiResponse.ok(res, inspection)
})

export const assignInspector = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as AssignInspectorInput
  const inspection = await qualityInspectionService.assignInspector(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inspection, 'Inspector assigned')
})

export const submitInspection = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as SubmitInspectionInput
  const inspection = await qualityInspectionService.submit(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inspection, 'Inspection submitted')
})
