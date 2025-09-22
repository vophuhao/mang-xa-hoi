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
}

export interface TypingData {
  partnerId: string;
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

// Extend Socket.IO types
declare module "socket.io" {
  interface Socket {
    userId: string;
  }
}