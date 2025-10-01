import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service";
import HashtagService from "../services/hashtag.service";

export const searchAllController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q = "", page = 1, limit = 10 } = req.query;
    const query = String(q);

    // Tìm kiếm user
    const usersResult = await UserService.searchUsers({
      query,
      page: Number(page),
      limit: Number(limit),
    });

    // Tìm kiếm hashtag
    const hashtagsResult = await HashtagService.searchHashtags({
      query,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      users: usersResult?.data ?? [],
      hashtags: hashtagsResult?.data ?? [],
      userPagination: usersResult?.pagination,
      hashtagPagination: hashtagsResult?.pagination,
    });
  } catch (err) {
    next(err);
  }
};