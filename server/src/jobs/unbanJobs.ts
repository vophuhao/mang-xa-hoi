import UserModel from "@/models/user.model";
import cron from "node-cron";

export async function autoUnbanUsers() {
  const now = new Date();
  const users = await UserModel.find({ isBanned: true, banUntil: { $ne: null, $lte: now } });
  for (const user of users) {
    user.isBanned = false;
    user.banUntil = null;
    await user.save();
    // Gửi notification mở khóa nếu muốn
  }
}

// Đặt lịch chạy mỗi giờ
cron.schedule("0 * * * *", autoUnbanUsers);