import mongoose from "mongoose";

const SavedAudioSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  }, // ai lưu

  audio: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Audio", 
    required: true,
    index: true 
  }, // âm thanh nào được lưu

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Không cho phép 1 user lưu trùng cùng 1 audio 2 lần
SavedAudioSchema.index({ user: 1, audio: 1 }, { unique: true });

export default mongoose.model("SavedAudio", SavedAudioSchema);
