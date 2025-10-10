import mongoose from "mongoose";

export interface StoryDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;

  // Story-specific features
  backgroundColor?: string;
  music?: {
    title: string;
    artist: string;
    url: string;
    duration: number; // in seconds
  };
  location?: {
    name: string;
    coordinates?: [number, number];
  };
  mentions: mongoose.Types.ObjectId[];
  tags: string[];

  // Interactions
  viewCount: number;
  likeCount: number;
  viewers: mongoose.Types.ObjectId[];

  // Story settings
  isHighlight: boolean;
  highlightTitle?: string;
  allowReplies: boolean;

  // Expiry
  expiresAt: Date;
  isExpired: boolean;

  createdAt: Date;
}

const storySchema = new mongoose.Schema<StoryDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
      default: "image",
    },
    caption: {
      type: String,
      maxlength: 500,
    },

    backgroundColor: {
      type: String,
      default: "#000000",
    },
    music: {
      title: String,
      artist: String,
      url: String,
      duration: Number,
    },
    location: {
      name: String,
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v: number[]) {
            // Allow null, undefined, or exactly 2 coordinates
            return !v || v.length === 0 || v.length === 2;
          },
          message: "Coordinates must be [longitude, latitude] or empty",
        },
      },
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [String],

    // Interactions
    viewCount: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Story settings
    isHighlight: { type: Boolean, default: false },
    highlightTitle: String,
    allowReplies: { type: Boolean, default: true },

    // Expiry - stories expire after 24 hours
    expiresAt: {
      type: Date,
      required: true,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      },
    },
    isExpired: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ isExpired: 1 });
storySchema.index({ isHighlight: 1 });

// TTL index to automatically delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
storySchema.methods.incrementView = async function () {
  this.viewCount += 1;
  return this.save();
};

storySchema.methods.incrementLike = async function () {
  this.likeCount += 1;
  return this.save();
};

storySchema.methods.decrementLike = async function () {
  if (this.likeCount > 0) this.likeCount -= 1;
  return this.save();
};

const StoryModel = mongoose.model<StoryDocument>("Story", storySchema);
export default StoryModel;
