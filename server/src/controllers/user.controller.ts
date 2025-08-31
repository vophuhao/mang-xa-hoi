import type { AuthenticatedRequest } from '@/types';
import type { Response } from 'express';

import UserModel from '@/models/user.model';
import { AppError } from '@/utils/AppError';
import catchErrors from '@/utils/catchErrors';
import { ResponseUtil } from '@/utils/response';

export const getUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.userId);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return ResponseUtil.success(res, user.omitPassword(), 'User profile retrieved successfully');
});
