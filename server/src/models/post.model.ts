import mongoose from "mongoose";

export interface PostDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  caption?: string;
  mediaUrls: string[];
  type: "post" | "reel";
  location?: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  tags: mongoose.Types.ObjectId[]
  mentions: mongoose.Types.ObjectId[];

  // Social metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;

  // Privacy & settings
  isHidden: boolean;
  commentsDisabled: boolean;
  likesHidden: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  comments?: any[]; // Virtual populate for comments
  audioId ?: mongoose.Types.ObjectId;


  // Methods
  incrementComment(): Promise<PostDocument>;
  decrementComment(): Promise<PostDocument>;
  incrementLike(): Promise<PostDocument>;
  decrementLike(): Promise<PostDocument>;
  incrementShare(): Promise<PostDocument>;
  incrementView(): Promise<PostDocument>;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: 2200, // Instagram's limit
    },
    mediaUrls: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.length <= 10; // Max 10 media items
        },
        message: "Post must have 1-10 media items",
      },
    },
    type: {
      type: String,
      enum: ["post", "reel"],
      required: true,
      default: function (this: PostDocument) {
        if (this.mediaUrls && this.mediaUrls.length === 1) {
          const url = this.mediaUrls[0]!; // chắc chắn không undefined
          if (url.match(/\.(mp4|mov|webm|avi)$/i)) {
            return "reel";
          }
        }
        // Mọi trường hợp còn lại → post
        return "post";
      },
    },
    location: {
      name: { type: String },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v: number[]) {
            return !v || v.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hashtag",
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    audioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audio",
    },

    // Social metrics
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },

    // Privacy & settings
    isHidden: { type: Boolean, default: false },
    commentsDisabled: { type: Boolean, default: false },
    likesHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for optimization
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ "location.coordinates": "2dsphere" }); // For geolocation

// Instance methods
postSchema.methods.incrementComment = async function () {
  this.commentCount += 1;
  return this.save();
};

postSchema.methods.decrementComment = async function () {
  if (this.commentCount > 0) this.commentCount -= 1;
  return this.save();
};

postSchema.methods.incrementLike = async function () {
  this.likeCount += 1;
  return this.save();
};

postSchema.methods.decrementLike = async function () {
  if (this.likeCount > 0) this.likeCount -= 1;
  return this.save();
};

postSchema.methods.incrementShare = async function () {
  this.shareCount += 1;
  return this.save();
};

postSchema.methods.incrementView = async function () {
  this.viewCount += 1;
  return this.save();
};

// Virtual populate for comments
postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  options: {
    sort: { createdAt: -1 },
    limit: 3,
    populate: {
      path: "user",
      select: "username fullName avatarUrl isVerified",
    },
  },
});

// Ensure virtual fields are serialized
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

const PostModel = mongoose.model<PostDocument>("Post", postSchema);
export default PostModel;
