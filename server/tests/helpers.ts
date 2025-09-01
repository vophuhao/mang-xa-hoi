import { JWT_SECRET } from "@/constants/env";
import Post from "@/models/post.model";
import User from "@/models/user.model";
import jwt from "jsonwebtoken";

export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    email: "test@example.com",
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    bio: "Test bio",
    isVerified: true,
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

export const createAuthToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET);
};

export const createTestPost = async (userId: string, postData = {}) => {
  const defaultPost = {
    content: "This is a test post",
    author: userId,
    likes: [],
    comments: [],
    hashtags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...postData,
  };

  const post = await Post.create(defaultPost);
  return post;
};

export const createMultipleTestUsers = async (count: number) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `test${i}@example.com`,
      username: `testuser${i}`,
      firstName: `Test${i}`,
      lastName: `User${i}`,
    });
    users.push(user);
  }
  return users;
};

export const createMultipleTestPosts = async (authorId: string, count: number) => {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const post = await createTestPost(authorId, {
      content: `This is test post number ${i + 1}`,
    });
    posts.push(post);
  }
  return posts;
};
