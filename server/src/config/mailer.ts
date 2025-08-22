import nodemailer from "nodemailer";
import { EMAIL_SENDER, EMAIL_PASS } from "../constants/env";

// Tạo transporter dùng Gmail
const transporter = nodemailer.createTransport({
  auth: {
    user: EMAIL_SENDER,
    pass: EMAIL_PASS,
  },
});

export default transporter;