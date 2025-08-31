import HashtagModel from "@/models/hashtag.model";
import PostModel from "@/models/post.model";
import mongoose from "mongoose";

export type CreateNewPost = {
  user: mongoose.Types.ObjectId;
  caption?: string;
  mediaUrls: string[];
  tags?: string[];
  location?: string;
  mentions?: mongoose.Types.ObjectId[];
};

export async function createPost(data: CreateNewPost) {
  // Validate that we have media
  if (!data.mediaUrls || data.mediaUrls.length === 0) {
    throw new Error("Post must have at least one media item");
  }

  // Determine media type
  let mediaType: "image" | "video" | "carousel" = "image";
  if (data.mediaUrls.length > 1) {
    mediaType = "carousel";
  }
  // You can add logic here to detect video based on file extension or metadata

  // Extract hashtags from caption if not provided in tags
  let hashtags = data.tags || [];
  if (data.caption) {
    const hashtagMatches = data.caption.match(/#\w+/g);
    if (hashtagMatches) {
      const captionHashtags = hashtagMatches.map(tag => tag.slice(1)); // Remove #
      hashtags = [...new Set([...hashtags, ...captionHashtags])];
    }
  }

  // Create location object if provided
  const location = data.location ? { name: data.location } : undefined;

  const post = await PostModel.create({
    user: data.user,
    caption: data.caption,
    mediaUrls: data.mediaUrls,
    mediaType,
    location,
    tags: hashtags,
    mentions: data.mentions || [],
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  });

  // Update hashtag counts
  if (hashtags.length > 0) {
    await Promise.all(hashtags.map(tag => HashtagModel.incrementPostCount(tag)));
  }

  return post.populate("user", "username fullName avatarUrl isVerified");
}
