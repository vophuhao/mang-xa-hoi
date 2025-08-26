import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  verified: boolean;
  provider: "local" | "google" | "google+local";
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Omit<UserDocument, "password">;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    username: { type: String, required: true, unique: true },
    fullName: { type: String },
    bio: { type: String, default: "" },
    avatarUrl: {
      type: String,
      default:
        "https://i.pinimg.com/736x/41/76/b9/4176b9b864c1947320764e82477c168f.jpg",
    },
    verified: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ["local", "google", "google+local"],
      default: "local",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Index để tối ưu query
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

userSchema.pre("save", async function (next) {
  // Tự động tạo name từ email nếu chưa có name
  if (!this.name || this.name === "User") {
    this.name = this.email ? this.email.split("@")[0] : "User";
  }

  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await hashValue(this.password);
  return next();
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
