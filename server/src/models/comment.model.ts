import mongoose from "mongoose";

export interface CommentDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  content: string;

  // Reply system
  parentComment?: mongoose.Types.ObjectId;
  replyCount: number;
  isReply: boolean;

  // Social features
  likeCount: number;
  mentions: mongoose.Types.ObjectId[];

  // Moderation
  isHidden: boolean;
  isPinned: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  incrementLike(): Promise<CommentDocument>;
  decrementLike(): Promise<CommentDocument>;
  incrementReply(): Promise<CommentDocument>;
  decrementReply(): Promise<CommentDocument>;
}

const commentSchema = new mongoose.Schema<CommentDocument>(
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
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000, // Instagram comment limit
    },

    // Reply system
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    replyCount: { type: Number, default: 0, min: 0 },
    isReply: {
      type: Boolean,
      default: function (this: CommentDocument) {
        return !!this.parentComment;
      },
    },

    // Social features
    likeCount: { type: Number, default: 0, min: 0 },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Moderation
    isHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for optimization
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ likeCount: -1 });
commentSchema.index({ isPinned: -1, createdAt: -1 });

// Methods
commentSchema.methods.incrementLike = async function () {
  this.likeCount += 1;
  return this.save();
};

commentSchema.methods.decrementLike = async function () {
  if (this.likeCount > 0) this.likeCount -= 1;
  return this.save();
};

commentSchema.methods.incrementReply = async function () {
  this.replyCount += 1;
  return this.save();
};

commentSchema.methods.decrementReply = async function () {
  if (this.replyCount > 0) this.replyCount -= 1;
  return this.save();
};

const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema);
export default CommentModel;
