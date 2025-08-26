import {
    OK,
    CREATED,
    BAD_REQUEST,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    UNPROCESSABLE_CONTENT,
    TOO_MANY_REQUESTS,
    INTERNAL_SERVER_ERROR

} from "../constants/http";
import mongoose from "mongoose";
import PostModel from "../models/post.model";

type CreateNewPost =
  | ({ user: mongoose.Types.ObjectId; caption: string; mediaUrls?: string[] })
  | ({ user: mongoose.Types.ObjectId; caption?: string; mediaUrls: string[] });



export async function createPost(data: CreateNewPost) {
  // Kiểm tra ít nhất có caption hoặc mediaUrls
  if ((!data.caption || data.caption.trim() === "") && (!data.mediaUrls || data.mediaUrls.length === 0)) {
    throw new Error("Post phải có ít nhất caption hoặc mediaUrls");
  }

  const post = await PostModel.create({
    user: data.user,  // lấy từ client/service
    caption: data.caption,
    mediaUrls: data.mediaUrls || [],
    likeCount: 0,
    commentCount: 0,
  });

  return post;
}

