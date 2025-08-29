import mongoose from "mongoose";

export interface FollowDocument extends mongoose.Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
}

const followSchema = new mongoose.Schema<FollowDocument>(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const FollowModel = mongoose.model<FollowDocument>("Follow", followSchema);
export default FollowModel;
