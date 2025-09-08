import { MONGO_URI } from "@/constants/env";
import PostModel from "@/models/post.model";
import UserModel from "@/models/user.model";
import "dotenv/config";
import mongoose from "mongoose";

// Additional posts data
const additionalPosts = [
  {
    caption: "Coffee and code - perfect morning combination ☕💻 Building something amazing today!",
    mediaUrls: ["https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=600&fit=crop"],
    mediaType: "image",
    tags: ["coding", "coffee", "productivity", "developer"],
    likeCount: 78,
    commentCount: 12,
    shareCount: 3,
    viewCount: 567,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Weekend hiking adventure! 🥾🏔️ The view from the top was absolutely breathtaking.",
    mediaUrls: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop"],
    mediaType: "image",
    tags: ["hiking", "adventure", "nature", "weekend"],
    likeCount: 203,
    commentCount: 28,
    shareCount: 11,
    viewCount: 1234,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Home studio setup complete! 🎤🎧 Ready to record some new tracks.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["music", "studio", "recording", "producer"],
    likeCount: 145,
    commentCount: 19,
    shareCount: 7,
    viewCount: 892,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Homemade pizza night! 🍕 Nothing beats fresh ingredients and good company.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["food", "pizza", "homemade", "cooking"],
    likeCount: 189,
    commentCount: 35,
    shareCount: 14,
    viewCount: 1567,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Morning yoga session in the park 🧘‍♀️🌳 Starting the day with mindfulness.",
    mediaUrls: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop"],
    mediaType: "image",
    tags: ["yoga", "mindfulness", "morning", "wellness"],
    likeCount: 267,
    commentCount: 41,
    shareCount: 18,
    viewCount: 2103,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "New art piece finished! 🎨✨ Spent weeks on this watercolor landscape.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["art", "painting", "watercolor", "landscape"],
    likeCount: 324,
    commentCount: 52,
    shareCount: 25,
    viewCount: 2876,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Beach sunset vibes 🏖️🌅 Perfect end to a perfect day.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["beach", "sunset", "ocean", "relaxation"],
    likeCount: 412,
    commentCount: 67,
    shareCount: 31,
    viewCount: 3245,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Book club meeting today! 📚☕ Discussing our latest read over coffee.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["books", "reading", "bookclub", "coffee"],
    likeCount: 156,
    commentCount: 23,
    shareCount: 9,
    viewCount: 1098,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Late night city lights ✨🏙️ Love the energy of the urban jungle.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["city", "nightlife", "urban", "photography"],
    likeCount: 298,
    commentCount: 44,
    shareCount: 22,
    viewCount: 2189,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
];

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

async function addMorePosts() {
  console.log("🌱 Adding more posts to database...\n");

  try {
    await connectDB();

    // Get all existing users
    const users = await UserModel.find({});
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log("❌ No users found. Please run the main seed script first.");
      return;
    }

    console.log("📝 Adding additional posts...");

    for (let i = 0; i < additionalPosts.length; i++) {
      const postData = additionalPosts[i];
      // Randomly assign posts to users
      const randomUser = users[Math.floor(Math.random() * users.length)];

      if (!randomUser) {
        console.log("❌ No user found for post");
        continue;
      }

      await PostModel.create({
        ...postData,
        user: randomUser._id,
      });

      // Update user's post count
      await UserModel.findByIdAndUpdate(randomUser._id, {
        $inc: { postsCount: 1 },
      });

      console.log(`   ✅ Created post by ${randomUser.username}`);
    }

    const totalPosts = await PostModel.countDocuments();

    console.log("\n🎉 Additional posts added successfully!");
    console.log(`📊 Total posts in database: ${totalPosts}`);
  } catch (error) {
    console.error("❌ Error adding posts:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n💤 Disconnected from database");
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  addMorePosts();
}

export default addMorePosts;
