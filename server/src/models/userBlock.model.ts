import mongoose from "mongoose";


const UserBlockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  blocked: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

UserBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default mongoose.model("UserBlock", UserBlockSchema);