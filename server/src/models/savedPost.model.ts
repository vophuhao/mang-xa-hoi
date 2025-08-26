import mongoose from "mongoose";

export interface SavedPostDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedPostSchema = new mongoose.Schema<SavedPostDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const SavedPostModel = mongoose.model<SavedPostDocument>("SavedPost", savedPostSchema);
export default SavedPostModel;
