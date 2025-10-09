import mongoose from "mongoose";

export interface CollectionDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isPrivate: boolean;
  coverImage?: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new mongoose.Schema<CollectionDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique collection names per user
collectionSchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
  }
);

// Index for querying collections
collectionSchema.index({ user: 1, createdAt: -1 });
collectionSchema.index({ user: 1, isPrivate: 1 });

const CollectionModel = mongoose.model<CollectionDocument>("Collection", collectionSchema);
export default CollectionModel;
