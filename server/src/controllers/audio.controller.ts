import Audio from '@/models/audio.model';
// controllers/musicController.ts
import { Request, Response } from "express";
import { fetchAndSaveMusic, trimVideo } from "@/services/audio.service";
import { ResponseUtil } from "@/utils/response";
import catchErrors from "@/utils/catchErrors";
import fs from "fs";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import cloudinary from "../config/cloudinary";
import Post from "../models/post.model";
import { BAD_REQUEST } from '@/constants/http';
import { AuthenticatedRequest } from '@/types';
ffmpeg.setFfmpegPath(path.resolve(__dirname, "../../bin/ffmpeg.exe"));
ffmpeg.setFfprobePath(path.resolve(__dirname, "../../bin/ffprobe.exe"));

export interface MulterRequest extends Request {
  // eslint-disable-next-line no-undef
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export async function syncMusic(req: Request, res: Response) {
  try {
    const { q } = req.query; // ví dụ ?q=son-tung
    const count = await fetchAndSaveMusic((q as string) || "vietnam");
    res.json({ message: `Đã đồng bộ ${count} bài hát` });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// API lấy danh sách nhạc trong DB (có search nội bộ)
export const getAudioList = catchErrors(async (req, res) => {

  const { q } = req.query;

  let query = {};
  if (q) {
    query = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } }
      ]
    };
  }

  const audios = await Audio.find(query)
    .populate("user", "userId _id avatarUrl ")
    .sort({ createdAt: -1 }).limit(50);
  ResponseUtil.success(res, audios);
})
export const trimVideoHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { start, end } = req.body;
  // eslint-disable-next-line no-undef
  const file = req.file as Express.Multer.File;
  if (!file || !file.buffer) {
    return res.status(400).json({ message: "Vui lòng upload 1 file video" });
  }

  // Tạo file tạm từ buffer
  const tempInputPath = path.join("uploads", `${uuidv4()}_${file.originalname}`);
  fs.writeFileSync(tempInputPath, file.buffer);

  // Kiểm tra start/end hợp lệ
  const startNum = Number(start);
  const endNum = Number(end);
  if (
    typeof startNum !== "number" || typeof endNum !== "number" ||
    isNaN(startNum) || isNaN(endNum) || startNum < 0 || endNum <= startNum
  ) {
    fs.unlinkSync(tempInputPath);
    return res.status(400).json({ message: "Tham số start/end không hợp lệ" });
  }

  try {
    const outputPath = await trimVideo(tempInputPath, startNum, endNum);
    res.download(outputPath, () => {
      fs.unlinkSync(outputPath);
      fs.unlinkSync(tempInputPath);
    });
  } catch (error) {
    fs.existsSync(tempInputPath) && fs.unlinkSync(tempInputPath);
    console.error("Trim video error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
  }
});


export const getPreviewUrl = catchErrors(async (req, res) => {
  const { id } = req.params; // id là deezerId
  if (!id) return res.status(400).json({ error: "Missing id" });

  // Gọi Deezer API để lấy previewUrl mới nhất
  const response = await axios.get(`https://api.deezer.com/track/${id}`);
  const previewUrl = response.data?.preview;

  if (!previewUrl) {
    return res.status(404).json({ error: "Preview URL not found" });
  }

  ResponseUtil.success(res, { previewUrl });
});


// eslint-disable-next-line no-undef
export async function extractAndUploadAudioFromVideoBuffer(file: Express.Multer.File): Promise<string> {
  if (!file || !file.buffer || !file.mimetype.startsWith("video/")) {
    throw new Error("Vui lòng upload 1 file video hợp lệ");
  }

  const tempVideoPath = path.join("uploads", `${uuidv4()}_${file.originalname}`);
  fs.writeFileSync(tempVideoPath, file.buffer);

  const tempAudioPath = tempVideoPath.replace(path.extname(tempVideoPath), ".mp3");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(tempVideoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .save(tempAudioPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  const uploadResult = await cloudinary.uploader.upload(tempAudioPath, {
    resource_type: "video",
    folder: "mang-xa-hoi-audio"
  });

  fs.unlinkSync(tempVideoPath);
  fs.unlinkSync(tempAudioPath);

  return uploadResult.secure_url;
}

export const extractAudioHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  // eslint-disable-next-line no-undef
  const file = req.file as Express.Multer.File;
  if (!file || !file.buffer || !file.mimetype.startsWith("video/")) {
    return res.status(400).json({ error: "Vui lòng upload 1 file video hợp lệ" });
  }
  try {
    const url = await extractAndUploadAudioFromVideoBuffer(file);
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Handler kiểm tra video có audio
export const checkVideoHasAudioHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  // eslint-disable-next-line no-undef
  const file = req.file as Express.Multer.File;
  if (!file || !file.mimetype.startsWith("video/")) {
    return res.status(BAD_REQUEST).json({ message: "Vui lòng upload 1 file video" });
  }

  // Lưu file tạm từ buffer
  const tempPath = path.join("uploads", `${uuidv4()}_${file.originalname}`);
  fs.writeFileSync(tempPath, file.buffer);

  ffmpeg.ffprobe(tempPath, (err, metadata) => {
    fs.unlinkSync(tempPath); // Xóa file tạm
    if (err) {
      console.error("ffprobe error:", err);
      return res.status(500).json({ message: "ffprobe error" });
    }
    const hasAudio = metadata.streams.some(s => s.codec_type === "audio");
    return res.json({
      message: "Kiểm tra thành công",
      hasAudio,
    });
  });
});

export const createAudio = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const url = req.body.fileUrl;
  const audio = await Audio.create({
    fileUrl: url,
    user: req.userId,
    title: "Âm thanh gốc"
  });
  return ResponseUtil.created(res, audio, "Audio created successfully");
});

// Tăng usedCount khi có post mới dùng audio này
export async function increaseAudioUsedCount(audioId: string) {
  await Audio.findByIdAndUpdate(audioId, { $inc: { usedCount: 1 } });
}



export async function getAllReelPostsByAudio(audioId: string) {
  return Post.find({ audio: audioId, type: "reel" });
}

