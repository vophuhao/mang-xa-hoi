import nodemailer from "nodemailer";
import { EMAIL_SENDER, EMAIL_PASS } from "../constants/env";

// Tạo transporter dùng Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // Gmail cần SSL
  auth: {
    user: EMAIL_SENDER,
    pass: EMAIL_PASS,
  },
});

export default transporter;