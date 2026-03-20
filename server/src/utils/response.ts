import { Response } from 'express';

/**
 * Standard Success Response Helper
 * @param res Express Response Object
 * @param data Data payload
 * @param message Optional friendly message
 * @param status HTTP Status Code (default 200)
 */
export const ok = (res: Response, data: any, message?: string, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    message
  });
};

/**
 * Standard Error Response Helper
 * @param res Express Response Object
 * @param status HTTP Status Code
 * @param error Human readable error message
 * @param code Machine readable error code
 * @param field Optional field that caused the validation error
 */
export const fail = (res: Response, status: number, error: string, code: string, field?: string) => {
  return res.status(status).json({
    success: false,
    error,
    code,
    field
  });
};
