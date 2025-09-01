import { MONGO_URI } from "@/constants/env";
import FollowModel from "@/models/follow.model";
import PostModel from "@/models/post.model";
import UserModel from "@/models/user.model";
import "dotenv/config";
import mongoose from "mongoose";

// Sample users data
const sampleUsers = [
  {
    email: "john.doe@example.com",
    password: "password123",
    username: "johndoe",
    fullName: "John Doe",
    bio: "🎨 Designer | 📸 Photographer | 🌍 Travel enthusiast",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: false,
    isPrivate: false,
    provider: "local",
    followersCount: 1250,
    followingCount: 890,
    postsCount: 0,
  },
  {
    email: "jane.smith@example.com",
    password: "password123",
    username: "janesmith",
    fullName: "Jane Smith",
    bio: "💻 Developer | 🚀 Tech enthusiast | ☕ Coffee lover",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612727c?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: true,
    isPrivate: false,
    provider: "local",
    followersCount: 2340,
    followingCount: 567,
    postsCount: 0,
  },
  {
    email: "alex.wilson@example.com",
    password: "password123",
    username: "alexwilson",
    fullName: "Alex Wilson",
    bio: "🏃‍♂️ Fitness coach | 🥗 Healthy lifestyle | 💪 Motivation daily",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: false,
    isPrivate: false,
    provider: "local",
    followersCount: 987,
    followingCount: 432,
    postsCount: 0,
  },
  {
    email: "emily.brown@example.com",
    password: "password123",
    username: "emilybrown",
    fullName: "Emily Brown",
    bio: "🍰 Baker | 📚 Book lover | 🌸 Spreading positivity",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: false,
    isPrivate: false,
    provider: "local",
    followersCount: 1567,
    followingCount: 234,
    postsCount: 0,
  },
  {
    email: "mike.johnson@example.com",
    password: "password123",
    username: "mikejohnson",
    fullName: "Mike Johnson",
    bio: "🎸 Musician | 🎵 Creating melodies | 🔥 Live your passion",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: false,
    isPrivate: false,
    provider: "local",
    followersCount: 3456,
    followingCount: 890,
    postsCount: 0,
  },
  {
    email: "sarah.davis@example.com",
    password: "password123",
    username: "sarahdavis",
    fullName: "Sarah Davis",
    bio: "🌿 Nature lover | 📸 Wildlife photographer | 🦋 Conservation advocate",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    verified: true,
    isVerified: true,
    isPrivate: false,
    provider: "local",
    followersCount: 2876,
    followingCount: 567,
    postsCount: 0,
  },
];

// Sample posts data
const samplePosts = [
  {
    caption:
      "Beautiful sunset from my morning hike! 🌅 Nothing beats starting the day with nature.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["sunset", "hiking", "nature", "morning"],
    likeCount: 142,
    commentCount: 23,
    shareCount: 5,
    viewCount: 1250,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "New project launch! 🚀 Excited to share what we've been working on.",
    mediaUrls: ["https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop"],
    mediaType: "image",
    tags: ["tech", "startup", "project", "coding"],
    likeCount: 89,
    commentCount: 15,
    shareCount: 12,
    viewCount: 890,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Morning workout complete! 💪 Who else is crushing their fitness goals today?",
    mediaUrls: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["fitness", "workout", "motivation", "health"],
    likeCount: 234,
    commentCount: 45,
    shareCount: 8,
    viewCount: 1890,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "Fresh baked chocolate chip cookies 🍪 Recipe in my stories!",
    mediaUrls: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop"],
    mediaType: "image",
    tags: ["baking", "cookies", "recipe", "homemade"],
    likeCount: 167,
    commentCount: 34,
    shareCount: 15,
    viewCount: 1456,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption: "New song dropping soon! 🎵 Can't wait for you all to hear it.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["music", "guitar", "song", "artist"],
    likeCount: 312,
    commentCount: 67,
    shareCount: 23,
    viewCount: 2340,
    isHidden: false,
    commentsDisabled: false,
    likesHidden: false,
  },
  {
    caption:
      "Spotted this amazing butterfly during today's nature walk 🦋 Nature never ceases to amaze!",
    mediaUrls: [
      "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=800&h=600&fit=crop",
    ],
    mediaType: "image",
    tags: ["nature", "butterfly", "wildlife", "photography"],
    likeCount: 456,
    commentCount: 78,
    shareCount: 34,
    viewCount: 3456,
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

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");
  await UserModel.deleteMany({});
  await PostModel.deleteMany({});
  await FollowModel.deleteMany({});
  console.log("✅ Database cleared");
}

async function seedUsers() {
  console.log("👥 Seeding users...");
  const users = [];

  for (const userData of sampleUsers) {
    // Don't hash password here - User model pre-save middleware will do it
    const user = await UserModel.create({
      ...userData,
      password: userData.password, // Use plain password
    });
    users.push(user);
    console.log(`   ✅ Created user: ${userData.username}`);
  }

  return users;
}

async function seedPosts(users: any[]) {
  console.log("📝 Seeding posts...");
  const posts = [];

  for (let i = 0; i < samplePosts.length; i++) {
    const postData = samplePosts[i];
    const user = users[i]; // Assign each post to a different user

    const post = await PostModel.create({
      ...postData,
      user: user._id,
    });

    // Update user's post count
    await UserModel.findByIdAndUpdate(user._id, {
      $inc: { postsCount: 1 },
    });

    posts.push(post);
    console.log(`   ✅ Created post by ${user.username}`);
  }

  return posts;
}

async function seedFollows(users: any[]) {
  console.log("👥 Seeding follow relationships...");

  // Create some follow relationships
  const followPairs: [number, number][] = [
    [0, 1], // john follows jane
    [0, 2], // john follows alex
    [1, 0], // jane follows john
    [1, 3], // jane follows emily
    [2, 0], // alex follows john
    [2, 4], // alex follows mike
    [3, 1], // emily follows jane
    [3, 5], // emily follows sarah
    [4, 2], // mike follows alex
    [4, 5], // mike follows sarah
    [5, 3], // sarah follows emily
    [5, 4], // sarah follows mike
  ];

  for (const [followerIdx, followeeIdx] of followPairs) {
    const follower = users[followerIdx];
    const followee = users[followeeIdx];

    await FollowModel.create({
      follower: follower._id,
      following: followee._id,
    });

    // Update follower and followee counts
    await UserModel.findByIdAndUpdate(follower._id, {
      $inc: { followingCount: 1 },
    });

    await UserModel.findByIdAndUpdate(followee._id, {
      $inc: { followersCount: 1 },
    });

    console.log(`   ✅ ${follower.username} follows ${followee.username}`);
  }
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n");

  try {
    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    await seedPosts(users);
    await seedFollows(users);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📝 Posts: ${samplePosts.length}`);
    console.log(`   🔗 Follows: 12 relationships`);

    console.log("\n🔐 Test accounts:");
    sampleUsers.forEach(user => {
      console.log(`   📧 ${user.email} | 🔑 password123 | 👤 @${user.username}`);
    });
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n💤 Disconnected from database");
    process.exit(0);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
