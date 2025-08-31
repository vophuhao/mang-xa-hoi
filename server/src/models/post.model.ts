import mongoose from 'mongoose';

export interface PostDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  caption?: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String },
    mediaUrls: { type: [String], required: true },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Tăng commentCount khi thêm comment
postSchema.methods.incrementComment = async function () {
  this.commentCount += 1;
  return this.save();
};

// Giảm commentCount khi xóa comment
postSchema.methods.decrementComment = async function () {
  if (this.commentCount > 0) this.commentCount -= 1;
  return this.save();
};

// Tăng likeCount khi like
postSchema.methods.incrementLike = async function () {
  this.likeCount += 1;
  return this.save();
};

// Giảm likeCount khi unlike
postSchema.methods.decrementLike = async function () {
  if (this.likeCount > 0) this.likeCount -= 1;
  return this.save();
};

const PostModel = mongoose.model<PostDocument>('Post', postSchema);
export default PostModel;
