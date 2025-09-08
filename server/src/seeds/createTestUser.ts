import { MONGO_URI } from "@/constants/env";
import UserModel from "@/models/user.model";
import { hashValue } from "@/utils/bcrypt";
import "dotenv/config";
import mongoose from "mongoose";

async function createTestUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Delete existing test user if exists
    await UserModel.deleteOne({ email: "test@example.com" });

    console.log("🔐 Hashing password...");
    const hashedPassword = await hashValue("password123");
    console.log("Generated hash:", hashedPassword);

    console.log("👤 Creating test user...");
    const user = await UserModel.create({
      email: "test@example.com",
      password: hashedPassword,
      username: "testuser",
      fullName: "Test User",
      bio: "Test account for debugging",
      verified: true,
      isVerified: false,
      isPrivate: false,
      provider: "local",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    });

    console.log("✅ Test user created:", user.username);

    // Test password comparison
    console.log("🧪 Testing password comparison...");
    const isPasswordValid = await user.comparePassword("password123");
    console.log("Password comparison result:", isPasswordValid);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("💤 Disconnected from database");
    process.exit(0);
  }
}

createTestUser();
