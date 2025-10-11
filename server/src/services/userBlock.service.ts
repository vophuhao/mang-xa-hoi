
import userBlockModel from "@/models/userBlock.model";
import ErrorFactory from "@/utils/ErrorFactory";


export class UserBlockService {
  /**
   * Block a user
   */
static async toggleBlockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId)
    throw ErrorFactory.validationFailed("You cannot block yourself");

  const existingBlock = await userBlockModel.findOne({
    blocker: blockerId,
    blocked: blockedId,
  });

  if (existingBlock) {
    // 🔹 Đã chặn trước đó → Bỏ chặn
    await userBlockModel.deleteOne({
      blocker: blockerId,
      blocked: blockedId,
    });
    return {
      action: "unblocked",
      message: "User has been unblocked successfully",
    };
  } else {
    // 🔹 Chưa chặn → Tiến hành chặn
    const newBlock = await userBlockModel.create({
      blocker: blockerId,
      blocked: blockedId,
    });

    const populated = await newBlock.populate("blocked", "username userId avatarUrl");

    return {
      action: "blocked",
      message: "User has been blocked successfully",
      data: populated,
    };
  }
}


  /**
   * Get list of users current user has blocked
   */
  static async getBlockedList(userId: string) {
    const [blocks, total] = await Promise.all([
      userBlockModel.find({ blocker: userId })
        .populate("blocked", "username userId avatarUrl isVerified"),
      userBlockModel.countDocuments({ blocker: userId }),
    ]);

    return {
      data: blocks,
    };
  }

  /**
   * Check if A blocked B
   */
  static async isBlocked(blockerId: string, blockedId: string) {
    return !!(await userBlockModel.exists({ blocker: blockerId, blocked: blockedId }));
  }

  /**
   * Get list of all userIds that current user should not see (either blocked or being blocked)
   */
  static async getExcludedUserIds(userId: string): Promise<string[]> {
    const relations = await userBlockModel.find({
      $or: [{ blocker: userId }, { blocked: userId }],
    });

    const excludedIds = relations.map(rel =>
      rel.blocker.toString() === userId ? rel.blocked.toString() : rel.blocker.toString()
    );

    return excludedIds;
  }
}
