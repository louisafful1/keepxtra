import type { Response } from 'express'
import type { PaginationMeta } from './pagination'

/**
 * Every successful response in the app is shaped by one of these two
 * helpers, so the frontend can rely on a single envelope shape regardless
 * of which endpoint it's calling.
 */
export class ApiResponse {
  static send<T>(res: Response, statusCode: number, data: T, message?: string): Response {
    return res.status(statusCode).json({ success: true, message, data })
  }

  static ok<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.send(res, 200, data, message)
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.send(res, 201, data, message)
  }

  static noContent(res: Response): Response {
    return res.status(204).send()
  }

  static paginated<T>(res: Response, data: T[], meta: PaginationMeta, message?: string): Response {
    return res.status(200).json({ success: true, message, data, meta })
  }
}
