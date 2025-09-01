const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const MONGO_URI =
  "mongodb+srv://vophuhao:phuhao123@cluster0-phuhao.bl35t.mongodb.net/tieuluancn?retryWrites=true&w=majority&appName=Cluster0-phuhao";

async function quickSeed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Check if users exist
    const userCount = await db.collection("users").countDocuments();
    console.log("Current users:", userCount);

    if (userCount === 0) {
      console.log("Creating test users...");

      // Create test users
      const hashedPassword = await bcrypt.hash("123456", 10);

      const users = [
        {
          username: "testuser",
          email: "test@example.com",
          password: hashedPassword,
          fullName: "Test User",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face",
          bio: "Test user for development",
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "johndoe",
          email: "john@example.com",
          password: hashedPassword,
          fullName: "John Doe",
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
          bio: "Software developer",
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "janedoe",
          email: "jane@example.com",
          password: hashedPassword,
          fullName: "Jane Doe",
          avatar:
            "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
          bio: "Designer and artist",
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await db.collection("users").insertMany(users);
      console.log("Created users:", result.insertedCount);
    }

    // Check if posts exist
    const postCount = await db.collection("posts").countDocuments();
    console.log("Current posts:", postCount);

    if (postCount === 0) {
      console.log("Creating test posts...");

      // Get users to create posts
      const users = await db.collection("users").find({}).toArray();

      if (users.length > 0) {
        const posts = [
          {
            content: "Hello world! This is my first post 🎉",
            author: users[0]._id,
            likes: [],
            likesCount: 0,
            comments: [],
            commentsCount: 0,
            images: [],
            hashtags: [],
            mentions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            content: "Beautiful sunset today! 🌅 #sunset #nature",
            author: users[1]._id,
            likes: [],
            likesCount: 0,
            comments: [],
            commentsCount: 0,
            images: [
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            ],
            hashtags: ["sunset", "nature"],
            mentions: [],
            createdAt: new Date(Date.now() - 3600000), // 1 hour ago
            updatedAt: new Date(Date.now() - 3600000),
          },
          {
            content: "Working on some exciting projects! 💻 #coding #webdev",
            author: users[2]._id,
            likes: [],
            likesCount: 0,
            comments: [],
            commentsCount: 0,
            images: [],
            hashtags: ["coding", "webdev"],
            mentions: [],
            createdAt: new Date(Date.now() - 7200000), // 2 hours ago
            updatedAt: new Date(Date.now() - 7200000),
          },
        ];

        const result = await db.collection("posts").insertMany(posts);
        console.log("Created posts:", result.insertedCount);
      }
    }

    console.log("Seed completed!");
    console.log("You can now log in with:");
    console.log("Email: test@example.com");
    console.log("Password: 123456");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

quickSeed();
