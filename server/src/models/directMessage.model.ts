import mongoose from "mongoose";

export interface DirectMessageDocument extends mongoose.Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";

  // Message types
  messageType: "text" | "media" | "post_share" | "story_share" | "location" | "voice";

  // Shared content references
  sharedPost?: mongoose.Types.ObjectId;
  sharedStory?: mongoose.Types.ObjectId;
  location?: {
    name: string;
    coordinates: [number, number];
  };

  // Message status
  isRead: boolean;
  readAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;

  // Message reactions (like Instagram)
  reactions: {
    user: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }[];

  // Reply to message
  replyTo?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const directMessageSchema = new mongoose.Schema<DirectMessageDocument>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxlength: 1000,
    },
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ["image", "video", "audio"],
    },

    messageType: {
      type: String,
      enum: ["text", "media", "post_share", "story_share", "location", "voice"],
      required: true,
      default: "text",
    },

    // Shared content
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    sharedStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    location: {
      name: String,
      coordinates: [Number],
    },

    // Status
    isRead: { type: Boolean, default: false },
    readAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,

    // Reactions
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, maxlength: 10 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Reply
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectMessage",
    },
  },
  { timestamps: true }
);

// Indexes
directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, isRead: 1 });
directMessageSchema.index({ createdAt: -1 });

const DirectMessageModel = mongoose.model<DirectMessageDocument>(
  "DirectMessage",
  directMessageSchema
);
export default DirectMessageModel;
