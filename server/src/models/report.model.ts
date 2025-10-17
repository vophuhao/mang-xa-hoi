import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  targetType: {
    type: String,
    enum: ["user", "post"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["pending", "resolved"],
    default: "pending",
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Report", ReportSchema);
