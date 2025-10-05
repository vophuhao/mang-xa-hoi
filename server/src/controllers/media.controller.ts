import { CLARIFAI_API_KEY } from "@/constants/env";
import type { AuthenticatedRequest } from "@/types";
import axios from "axios";
import { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary";
import { BAD_REQUEST } from "../constants/http";
import catchErrors from "../utils/catchErrors";

// Mở rộng type cho Request khi dùng Multer

const CLARIFAI_MODEL_ID = "general-image-recognition";
const CLARIFAI_MODEL_VERSION_ID = "aa7f35c01e0642fda5cf400f543e7c40"; // ID chính thức của Clarifai
const CLARIFAI_API_URL = `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/versions/${CLARIFAI_MODEL_VERSION_ID}/outputs`;

export interface MulterRequest extends Request {
  // eslint-disable-next-line no-undef
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Hàm làm sạch tên file để tránh lỗi Windows
function sanitizeFilename(filename: string) {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);
  base = base.replace(/[^a-zA-Z0-9_-]/g, "");
  if (base.length > 40) base = base.slice(0, 40);
  return base + ext;
}

// Hàm kiểm tra video có audio track không
async function hasAudioTrack(videoPath: string): Promise<boolean> {
  return new Promise(resolve => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return resolve(false);
      const hasAudio = metadata.streams.some((s: any) => s.codec_type === "audio");
      resolve(hasAudio);
    });
  });
}

// Hàm phân tích ảnh bằng Clarifai (từ buffer)
// eslint-disable-next-line no-undef
export async function getHashtagsFromImageBuffer(file: Express.Multer.File): Promise<string[]> {
  const base64 = file.buffer.toString("base64");
  const response = await axios.post(
    CLARIFAI_API_URL,
    {
      inputs: [
        {
          data: { image: { base64 } },
        },
      ],
    },
    {
      headers: {
        Authorization: `Key ${CLARIFAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const concepts = response.data.outputs[0]?.data?.concepts || [];
  return concepts.slice(0, 20).map((c: any) => c.name.toLowerCase().replace(/\s+/g, ""));
}

// API Handler
export const analyzeMediaHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  // eslint-disable-next-line no-undef
  let filesArray: Express.Multer.File[] = [];
  if (Array.isArray(req.files)) {
    filesArray = req.files;
  } else if (req.files && typeof req.files === "object") {
    filesArray = Object.values(req.files).flat();
  }
  if (!filesArray || filesArray.length === 0) {
    return res.status(BAD_REQUEST).json({ message: "Không có file nào được upload" });
  }
  try {
    let hashtags: string[] = [];
    for (const file of filesArray) {
      if (file.mimetype.startsWith("image/")) {
        const tags = await getHashtagsFromImageBuffer(file);
        hashtags = hashtags.concat(tags);
      } else if (file.mimetype.startsWith("video/")) {
        hashtags.push("");
      }
    }
    hashtags = [...new Set(hashtags)];
    return res.json({
      message: "Phân tích thành công",
      hashtags,
    });
  } catch (err: any) {
    console.error("❌ Lỗi:", err.response?.data || err.message);
    return res.status(500).json({ message: "Phân tích thất bại", error: err.message });
  }
});

// Hàm upload 1 file buffer lên Cloudinary
// eslint-disable-next-line no-undef
const uploadBufferToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mang-xa-hoi-image",
        resource_type: "auto", // hỗ trợ cả ảnh & video
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

// Handler download file
async function downloadFile(url: string, outputPath: string) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios.get(url, { responseType: "stream" });
  response.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Hàm thay thế audio gốc bằng audio phụ
async function replaceAudioInVideo(videoPath: string, audioPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions(["-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-shortest"])
      .save(outputPath)
      .on("end", () => resolve())
      .on("error", err => reject(err));
  });
}

// Hàm mix audio gốc với audio phụ
async function mixAudioToVideo(videoPath: string, audioPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter(["[0:a][1:a]amix=inputs=2:duration=first[aout]"])
      .outputOptions(["-map", "0:v:0", "-map", "[aout]", "-c:v", "copy", "-shortest"])
      .save(path.normalize(outputPath)) // chuẩn hóa path
      .on("end", () => resolve())
      .on("error", err => {
        console.error("FFmpeg mixAudioToVideo error:", err);
        reject(err);
      });
  });
}

// Hàm xoá toàn bộ audio track khỏi video
async function removeAudioFromVideo(videoPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        "-c",
        "copy",
        "-an", // remove all audio
      ])
      .save(outputPath)
      .on("end", () => resolve())
      .on("error", err => reject(err));
  });
}

// Đảm bảo thư mục uploads tồn tại
fs.mkdirSync("uploads", { recursive: true });

export const saveMediaHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  // eslint-disable-next-line no-undef
  let filesArray: Express.Multer.File[] = [];
  if (Array.isArray(req.files)) {
    filesArray = req.files;
  } else if (req.files && typeof req.files === "object") {
    filesArray = Object.values(req.files).flat();
  }
  if (!filesArray || filesArray.length === 0) {
    return res.status(BAD_REQUEST).json({ message: "Không có file nào được upload" });
  }
  const audioUrl = req.body.audioUrl;
  const muteOriginal = req.body.muteOriginal === "true";
  try {
    const urls = [];
    for (const file of filesArray) {
      if (file.mimetype.startsWith("video/")) {
        const safeName = sanitizeFilename(file.originalname);
        const tempVideoPath = path.join("uploads", `${Date.now()}_${safeName}`);
        fs.writeFileSync(tempVideoPath, file.buffer);

        // 1. Nếu tắt tiếng gốc và không có nhạc nền: xoá toàn bộ audio
        if (muteOriginal && !audioUrl) {
          const tempOutputPath = tempVideoPath.replace(path.extname(tempVideoPath), "_noaudio.mp4");
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          await removeAudioFromVideo(tempVideoPath, tempOutputPath);
          const url = await uploadBufferToCloudinary({
            ...file,
            buffer: fs.readFileSync(tempOutputPath),
            mimetype: "video/mp4",
            originalname: path.basename(tempOutputPath),
          });
          urls.push(url);
          fs.unlinkSync(tempVideoPath);
          fs.unlinkSync(tempOutputPath);
          continue;
        }

        // 2. Nếu tắt tiếng gốc và có nhạc nền: chỉ giữ nhạc nền
        if (muteOriginal && audioUrl) {
          const tempAudioPath = tempVideoPath.replace(path.extname(tempVideoPath), ".mp3");
          await downloadFile(audioUrl, tempAudioPath);
          const tempOutputPath = tempVideoPath.replace(path.extname(tempVideoPath), "_replace.mp4");
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          await replaceAudioInVideo(tempVideoPath, tempAudioPath, tempOutputPath);
          const url = await uploadBufferToCloudinary({
            ...file,
            buffer: fs.readFileSync(tempOutputPath),
            mimetype: "video/mp4",
            originalname: path.basename(tempOutputPath),
          });
          urls.push(url);
          fs.unlinkSync(tempVideoPath);
          fs.unlinkSync(tempAudioPath);
          fs.unlinkSync(tempOutputPath);
          continue;
        }

        // 3. Nếu không tắt tiếng gốc và có nhạc nền: mix nhạc gốc với nhạc nền
        if (!muteOriginal && audioUrl) {
          const tempAudioPath = tempVideoPath.replace(path.extname(tempVideoPath), ".mp3");
          await downloadFile(audioUrl, tempAudioPath);

          // Kiểm tra video có audio track không
          const hasAudio = await hasAudioTrack(tempVideoPath);
          let tempOutputPath: string;
          if (!hasAudio) {
            // Nếu không có audio gốc, chỉ replace audio
            tempOutputPath = path.resolve("uploads", `${Date.now()}_replace.mp4`);
            if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            await replaceAudioInVideo(tempVideoPath, tempAudioPath, tempOutputPath);
          } else {
            // Nếu có audio gốc, mix như thường
            tempOutputPath = path.resolve("uploads", `${Date.now()}_mix.mp4`);
            if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            await mixAudioToVideo(tempVideoPath, tempAudioPath, tempOutputPath);
          }
          const url = await uploadBufferToCloudinary({
            ...file,
            buffer: fs.readFileSync(tempOutputPath),
            mimetype: "video/mp4",
            originalname: path.basename(tempOutputPath),
          });
          urls.push(url);
          fs.unlinkSync(tempVideoPath);
          fs.unlinkSync(tempAudioPath);
          fs.unlinkSync(tempOutputPath);
          continue;
        }

        // 4. Không tắt tiếng, không nhạc nền: upload như cũ (giữ nguyên tiếng gốc)
        const url = await uploadBufferToCloudinary(file);
        urls.push(url);
        fs.unlinkSync(tempVideoPath);
      } else {
        // Ảnh: upload như cũ
        const url = await uploadBufferToCloudinary(file);
        urls.push(url);
      }
    }
    return res.json({
      message: "Upload thành công",
      urls,
    });
  } catch (err) {
    return res.status(500).json({ message: "Upload thất bại", error: err });
  }
});
