import mongoose from "mongoose";

export interface NotificationDocument extends mongoose.Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type:
    | "like"
    | "comment"
    | "reply"
    | "follow"
    | "mention"
    | "message"
    | "story_view"
    | "direct_message"
    | "post_share"
    | "warning"
    | "soft_ban"
    | "hard_ban";
  message: string;

  // Reference to related content
  post?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  directMessage?: mongoose.Types.ObjectId;

  // Notification status
  isRead: boolean;
  readAt?: Date;

  // Grouping (for "user1, user2 and 3 others liked your post")
  groupKey?: string;
  isGrouped: boolean;

  // Additional metadata (e.g., message count for grouped notifications)
  metadata?: {
    messageCount?: number;
    [key: string]: any;
  };

  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "reply",
        "follow",
        "mention",
        "message",
        "story_view",
        "direct_message",
        "post_share",
        "warning",     // cảnh cáo
        "soft_ban",    // khóa tạm thời
        "hard_ban",    // khóa vĩnh viễn
        "post_removed",
      ],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 255,
    },

    // References
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    directMessage: { type: mongoose.Schema.Types.ObjectId, ref: "DirectMessage" },

    // Status
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,

    // Grouping
    groupKey: { type: String },
    isGrouped: { type: Boolean, default: false },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL index to auto-delete old notifications (optional - after 30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
export default NotificationModel;
