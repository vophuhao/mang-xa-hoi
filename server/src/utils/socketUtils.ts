export class SocketUtils {
  static generateRoomName(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join("_");
  }

  static getUserRoom(userId: string): string {
    return `user_${userId}`;
  }

  static isValidSocketEvent(eventName: string): boolean {
    const validEvents = [
      "send_message",
      "join_conversation",
      "leave_conversation",
      "typing",
      "stop_typing",
      "mark_as_read",
      "react_message"
    ];
    return validEvents.includes(eventName);
  }
}