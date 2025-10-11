import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { UserBlockService } from "@/services/userBlock.service";

import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import { blockUserSchema, getUserByUserIdSchema } from "@/validators";
import { getBlockedListSchema } from "@/validators/userBlock.validator";

/**
 * @route POST /users/:userId/block
 */
export const toggleBlockHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } =  getUserByUserIdSchema.parse(req.params); // user muốn chặn hoặc bỏ chặn
  console.log("toggleBlockHandler", { userId, userIdBlocked: req.userId });
  if (!userId ) {
    throw new Error("Both userId and userIdBlocked are required");
  }
  const result = await UserBlockService.toggleBlockUser((req.userId as any).toString(), userId);
  return ResponseUtil.success(res, result, result.message);
});

/**
 * @route GET /users/blocked
 */
export const getBlockedListHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = getBlockedListSchema.parse(req).query;
  const result = await UserBlockService.getBlockedList(req.userId!.toString(), page, limit);
  return ResponseUtil.success(res, result.data, "Blocked users retrieved successfully");
});
