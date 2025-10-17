import DirectMessageModel from "@/models/directMessage.model";
import UserModel from "@/models/user.model";
import PostModel from "@/models/post.model";
import StoryModel from "@/models/story.model";
import NotificationModel from "@/models/notification.model";
import ErrorFactory from "@/utils/ErrorFactory";
import mongoose from "mongoose";

export type SendMessageData = {
  senderId: string;
  recipientId: string;
  content?: string | undefined;
  messageType: "text" | "media" | "post_share" | "story_share" | "location" | "voice";
  mediaUrl?: string | undefined;
  mediaType?: "image" | "video" | "audio" | undefined;
  sharedPost?: string | undefined;
  sharedStory?: string | undefined;
  location?: {
    name: string;
    coordinates: [number, number];
  } | undefined; 
  replyTo?: string | undefined;
};

export interface GetConversationParams {
  userId: string;
  partnerId: string;
  page: number;
  limit: number;
}

export interface ReactToMessageParams {
  messageId: string;
  userId: string;
  emoji: string;
}

/**
 * DirectMessage service containing all message-related business logic
 */
export class DirectMessageService {
  /**
   * Send a new message
   */
  static async sendMessage(data: SendMessageData) {
    // Validate users exist
    const [sender, recipient] = await Promise.all([
      UserModel.findById(data.senderId),
      UserModel.findById(data.recipientId)
    ]);

    if (!sender) {
      throw ErrorFactory.resourceNotFound("Sender");
    }

    if (!recipient) {
      throw ErrorFactory.resourceNotFound("Recipient");
    }

    // Validate message content based on type
    if (data.messageType === "text" && !data.content) {
      throw ErrorFactory.validationFailed("Text message must have content");
    }

    if (data.messageType === "media" && !data.mediaUrl) {
      throw ErrorFactory.validationFailed("Media message must have media URL");
    }

    if (data.messageType === "post_share" && !data.sharedPost) {
      throw ErrorFactory.validationFailed("Post share must reference a post");
    }

    if (data.messageType === "story_share" && !data.sharedStory) {
      throw ErrorFactory.validationFailed("Story share must reference a story");
    }

    // Validate shared content exists
    if (data.sharedPost) {
      const post = await PostModel.findById(data.sharedPost);
      if (!post) {
        throw ErrorFactory.resourceNotFound("Shared post");
      }
    }

    if (data.sharedStory) {
      const story = await StoryModel.findById(data.sharedStory);
      if (!story) {
        throw ErrorFactory.resourceNotFound("Shared story");
      }
    }

    // Validate reply message exists
    if (data.replyTo) {
      const replyMessage = await DirectMessageModel.findById(data.replyTo);
      if (!replyMessage) {
        throw ErrorFactory.resourceNotFound("Message to reply to");
      }
    }

    const message = await DirectMessageModel.create({
      sender: data.senderId,
      recipient: data.recipientId,
      content: data.content,
      messageType: data.messageType,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      sharedPost: data.sharedPost,
      sharedStory: data.sharedStory,
      location: data.location,
      replyTo: data.replyTo,
      isDelivered: true,
      deliveredAt: new Date()
    });

    // Create notification for recipient
    await NotificationModel.create({
      recipient: data.recipientId,
      sender: data.senderId,
      type: "direct_message",
      message: "sent you a message",
      directMessage: message._id // Reference to message
    });

    return message.populate([
      { path: "sender", select: "username userId avatarUrl isVerified" },
      { path: "recipient", select: "username userId avatarUrl isVerified" },
      { path: "replyTo" },
      { path: "sharedPost", populate: { path: "user", select: "username avatarUrl" } },
      { path: "sharedStory", populate: { path: "user", select: "username avatarUrl" } }
    ]);
  }

  /**
   * Get conversation between two users
   */
  static async getConversation({ userId, partnerId, page = 1, limit = 10 }: GetConversationParams) {
    const skip = (page - 1) * limit;

    // Validate users exist
    const [user, partner] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(partnerId)
    ]);

    if (!user) {
      throw ErrorFactory.resourceNotFound("User");
    }

    if (!partner) {
      throw ErrorFactory.resourceNotFound("Partner");
    }

    const [messages, total] = await Promise.all([
      DirectMessageModel.find({
        $or: [
          { sender: userId, recipient: partnerId },
          { sender: partnerId, recipient: userId }
        ]
      })
      .populate([
        { path: "sender", select: "username userId avatarUrl isVerified" },
        { path: "recipient", select: "username userId avatarUrl isVerified" },
        { path: "replyTo" },
        { path: "sharedPost", populate: { path: "user", select: "username avatarUrl" } },
        { path: "sharedStory", populate: { path: "user", select: "username avatarUrl" } }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      
      DirectMessageModel.countDocuments({
        $or: [
          { sender: userId, recipient: partnerId },
          { sender: partnerId, recipient: userId }
        ]
      })
    ]);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string, userId: string) {
    const message = await DirectMessageModel.findById(messageId);
    
    if (!message) {
      throw ErrorFactory.resourceNotFound("Message");
    }

    if (message.recipient.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only mark your received messages as read");
    }

    if (message.isRead) {
      return {
        message: "Message already marked as read",
        data: message
      };
    }

    message.isRead = true;
    message.readAt = new Date();
    
    await message.save();

    return {
      message: "Message marked as read",
      data: message
    };
  }

  /**
   * Mark all messages as read
   */
  static async markAllAsRead(userId: string, partnerId: string) {
    // Validate users exist
    const partner = await UserModel.findById(partnerId);
    if (!partner) {
      throw ErrorFactory.resourceNotFound("Partner");
    }

    const result = await DirectMessageModel.updateMany(
      {
        sender: partnerId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return {
      message: "All messages marked as read",
      modifiedCount: result.modifiedCount
    };
  }

  /**
   * React to message
   */
  static async reactToMessage({ messageId, userId, emoji }: ReactToMessageParams) {
    const message = await DirectMessageModel.findById(messageId);
    
    if (!message) {
      throw ErrorFactory.resourceNotFound("Message");
    }

    // Check if user is participant in conversation
    const isParticipant = message.sender.toString() === userId || message.recipient.toString() === userId;
    if (!isParticipant) {
      throw ErrorFactory.insufficientPermissions("You can only react to messages in your conversations");
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== userId
    );

    // Add new reaction
    message.reactions.push({
      user: new mongoose.Types.ObjectId(userId),
      emoji,
      createdAt: new Date()
    });

    await message.save();

    return {
      message: "Reaction added",
      data: message
    };
  }

  /**
   * Remove reaction from message
   */
  static async removeReaction(messageId: string, userId: string) {
    const message = await DirectMessageModel.findById(messageId);
    
    if (!message) {
      throw ErrorFactory.resourceNotFound("Message");
    }

    // Check if user is participant in conversation
    const isParticipant = message.sender.toString() === userId || message.recipient.toString() === userId;
    if (!isParticipant) {
      throw ErrorFactory.insufficientPermissions("You can only remove reactions from messages in your conversations");
    }

    const initialLength = message.reactions.length;
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== userId
    );

    if (message.reactions.length === initialLength) {
      return {
        message: "No reaction found to remove",
        data: message
      };
    }

    await message.save();

    return {
      message: "Reaction removed",
      data: message
    };
  }

  /**
   * Get user's conversations list
   */
  static async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const conversations = await DirectMessageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner"
        }
      },
      {
        $unwind: "$partner"
      },
      {
        $project: {
          partner: {
            _id: 1,
            username: 1,
            userId: 1,
            avatarUrl: 1,
            isVerified: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    const total = await DirectMessageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$recipient",
              "$sender"
            ]
          }
        }
      },
      {
        $count: "total"
      }
    ]);

    const totalCount = total[0]?.total || 0;

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string, userId: string) {
    const message = await DirectMessageModel.findById(messageId);

    if (!message) {
      throw ErrorFactory.resourceNotFound("Message");
    }

    // Only sender can delete message
    if (message.sender.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only delete your own messages");
    }

    await DirectMessageModel.findByIdAndDelete(messageId);

    return { message: "Message deleted successfully" };
  }

  /**
   * Get message by ID
   */
  static async getMessageById(messageId: string, userId: string) {
    const message = await DirectMessageModel.findById(messageId)
      .populate([
        { path: "sender", select: "username userId avatarUrl isVerified" },
        { path: "recipient", select: "username userId avatarUrl isVerified" },
        { path: "replyTo" },
        { path: "sharedPost", populate: { path: "user", select: "username avatarUrl" } },
        { path: "sharedStory", populate: { path: "user", select: "username avatarUrl" } }
      ]);

    if (!message) {
      throw ErrorFactory.resourceNotFound("Message");
    }

    // Check if user is participant in conversation
    const isParticipant = message.sender._id.toString() === userId || message.recipient._id.toString() === userId;
    if (!isParticipant) {
      throw ErrorFactory.insufficientPermissions("You can only view messages in your conversations");
    }

    return message;
  }
}

// Legacy functions for backward compatibility
export async function sendMessage(data: SendMessageData) {
  return DirectMessageService.sendMessage(data);
}

export async function getConversation(params: GetConversationParams) {
  return DirectMessageService.getConversation(params);
}

export default DirectMessageService;