import mongoose from "mongoose";

export interface LikeDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  type: "post" | "comment" | "story";
  createdAt: Date;
}

const likeSchema = new mongoose.Schema<LikeDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      index: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      index: true,
    },
    type: {
      type: String,
      enum: ["post", "comment", "story"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes to prevent duplicate likes
likeSchema.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } }
);
likeSchema.index(
  { user: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);
likeSchema.index(
  { user: 1, story: 1 },
  { unique: true, partialFilterExpression: { story: { $exists: true } } }
);


// General indexes for queries
likeSchema.index({ post: 1, createdAt: -1 });
likeSchema.index({ type: 1 });

const LikeModel = mongoose.model<LikeDocument>("Like", likeSchema);
export default LikeModel;
