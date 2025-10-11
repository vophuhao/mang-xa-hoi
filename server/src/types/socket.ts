export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface MessageData {
  recipientId: string;
  content?: string;
  messageType: "text" | "media" | "post_share" | "story_share" | "location" | "voice";
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";
  sharedPost?: string;
  sharedStory?: string;
  location?: {
    name: string;
    coordinates: [number, number];
  };
  replyTo?: string;
  conversationId?: string;
  tempId?: string;
}

export interface TypingData {
  partnerId: string;
  conversationId?: string;
}

export interface ReadMessageData {
  messageId: string;
  partnerId: string;
}

export interface ReactMessageData {
  messageId: string;
  emoji: string;
  partnerId: string;
}

export interface JoinConversationData {
  conversationId: string;
}

export interface UserPresenceData {
  userId: string;
  socketId: string;
  status: 'online' | 'offline';
}

// ✅ Extend Socket.IO types
declare module "socket.io" {
  interface Socket {
    userId: string;
    user?: {
      id: string;
      username?: string;
      userId?: string;
      avatarUrl?: string;
    };
  }
}