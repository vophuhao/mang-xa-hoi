import mongoose from "mongoose";

export interface SavedPostDocument extends Omit<mongoose.Document, "collection"> {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  collection?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedPostSchema = new mongoose.Schema<SavedPostDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Allow null collection for backward compatibility - posts saved without collection
savedPostSchema.index(
  { user: 1, post: 1, collection: 1 },
  {
    unique: true,
    partialFilterExpression: { collection: { $exists: true } },
  }
);

// For posts saved without collection (backward compatibility)
savedPostSchema.index(
  { user: 1, post: 1 },
  {
    unique: true,
    partialFilterExpression: { collection: { $exists: false } },
  }
);

// Indexes for queries
savedPostSchema.index({ user: 1, createdAt: -1 });
savedPostSchema.index({ collection: 1, createdAt: -1 });
savedPostSchema.index({ user: 1, collection: 1, createdAt: -1 });

const SavedPostModel = mongoose.model<SavedPostDocument>("SavedPost", savedPostSchema);
export default SavedPostModel;
