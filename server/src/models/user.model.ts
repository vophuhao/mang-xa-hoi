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
  googleId?: string; // Thêm googleId để track Google account
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string;
  provider: 'local' | 'google' | 'google+local';
  __v?: number;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Pick<
    UserDocument,
    "_id" | "email" | "verified" | "createdAt" | "updatedAt" | "avatarUrl"| "__v"
  >;
  omitPassword(): Omit<UserDocument, "password">;
}


const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.provider === 'local';
      },
    },
    verified: { type: Boolean, required: true, default: false },
    avatarUrl: { 
      type: String ,
      default: "https://i.pinimg.com/736x/41/76/b9/4176b9b864c1947320764e82477c168f.jpg",
    },
   provider: {
  type: String,
  enum: ['local', 'google', 'google+local'],
  default: 'local'
}

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    username: {
      type: String,
      required: false,
      default: "User", // Simple default, sẽ set name trong pre-save hook
    },
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
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Cho phép multiple null values nhưng unique khi có giá trị
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Index để tối ưu query
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

// Index để tối ưu query
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

userSchema.pre("save", async function (next) {
  // Tự động tạo username từ email nếu chưa có username
  if (!this.username || this.username === "User") {
    this.username = this.email ? this.email.split("@")[0] : "User";
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
