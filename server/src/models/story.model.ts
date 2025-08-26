import mongoose from "mongoose";

export interface StoryDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  mediaUrl: string;
  viewers: mongoose.Types.ObjectId[];
  expiresAt: Date; // 24h sau tạo
  createdAt: Date;
}

const storySchema = new mongoose.Schema<StoryDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const StoryModel = mongoose.model<StoryDocument>("Story", storySchema);
export default StoryModel;
