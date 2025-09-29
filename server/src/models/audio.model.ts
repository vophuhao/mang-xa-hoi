import mongoose from "mongoose";

const AudioSchema = new mongoose.Schema({
  deezerId: { type: String, unique: true, sparse: true }, // Có thể null nếu là audio user upload
  title: { type: String },
  artist: { type: String },
  duration: { type: Number },
  cover: { type: String },
  fileUrl: { type: String }, // Chỉ dùng cho audio user upload
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,index :true },
  used: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});



export default mongoose.model("Audio", AudioSchema);