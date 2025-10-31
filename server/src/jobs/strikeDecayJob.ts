import UserModel from "@/models/user.model";
import cron from "node-cron";

export async function decayStrikes() {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const users = await UserModel.find({ strikes: { $gt: 0 }, lastStrikeAt: { $lte: threeMonthsAgo } });
  for (const user of users) {
    user.strikes -= 1;
    await user.save();
  }
}
cron.schedule("0 0 * * 0", decayStrikes); // mỗi tuần