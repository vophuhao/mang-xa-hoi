import mongoose from "mongoose";

export interface HashtagDocument extends mongoose.Document {
  name: string; // without the # symbol
  displayName: string; // with proper casing
  postCount: number;
  isFeatures: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HashtagModel extends mongoose.Model<HashtagDocument> {
  incrementPostCount(tagName: string): Promise<HashtagDocument | null>;
  decrementPostCount(tagName: string): Promise<HashtagDocument | null>;
}

const hashtagSchema = new mongoose.Schema<HashtagDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 100,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    isFeatures: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
hashtagSchema.index({ postCount: -1 });
hashtagSchema.index({ name: "text", displayName: "text" });
hashtagSchema.index({ isFeatures: -1, postCount: -1 });

// Static methods
hashtagSchema.statics.incrementPostCount = async function (tagName: string) {
  return this.findOneAndUpdate(
    { name: tagName.toLowerCase() },
    {
      $inc: { postCount: 1 },
      $setOnInsert: {
        displayName: tagName,
        name: tagName.toLowerCase(),
      },
    },
    { upsert: true, new: true }
  );
};

hashtagSchema.statics.decrementPostCount = async function (tagName: string) {
  return this.findOneAndUpdate(
    { name: tagName.toLowerCase() },
    { $inc: { postCount: -1 } },
    { new: true }
  );
};

const HashtagModelInstance = mongoose.model<HashtagDocument, HashtagModel>(
  "Hashtag",
  hashtagSchema
);
export default HashtagModelInstance;
