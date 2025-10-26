import { getAudioByIdSchema } from './../validators/audio.validator';
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
import FuzzySearch from "fuzzy-search";
import saveAudioModel from '@/models/saveAudio.model';
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

function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD") // tách dấu
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase();
}

export const getAudioList = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { q } = req.query as { q?: string };

  const audios = await Audio.find()
    .populate("user", "userId _id avatarUrl")
    .sort({ createdAt: -1 });

  if (!q || q.trim() === "") {
    return ResponseUtil.success(res, audios.slice(0, 50));
  }

  // Chuẩn hóa keyword không dấu + lowercase
  const normalizedQ = removeVietnameseTones(q);

  // Chuẩn hóa dữ liệu audioList trước khi search
  const normalizedAudios = audios.map((audio) => ({
    ...audio.toObject(),
    normalizedTitle: removeVietnameseTones(audio.title || ""),
    normalizedArtist: removeVietnameseTones(audio.artist || ""),
  }));

  const searcher = new FuzzySearch(
    normalizedAudios,
    ["normalizedTitle", "normalizedArtist"],
    { caseSensitive: false }
  );

  const results = searcher.search(normalizedQ);

  ResponseUtil.success(res, results.slice(0, 50));
});


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
  console.log(req.userId);
  const audio = await Audio.create({
    fileUrl: url,
    used :1 ,
    user: req.userId,
    title: "Âm thanh gốc"
  });
  return ResponseUtil.created(res, audio, "Audio created successfully");
});

// Tăng usedCount khi có post mới dùng audio này
export async function increaseAudioUsedCount(audioId: string) {
  await Audio.findByIdAndUpdate(audioId, { $inc: { usedCount: 1 } });
}



export const getAllReelPostsByAudio = catchErrors(async (req, res) => {
  try {
    const { id } = req.params; // id của audio

    const reels = await Post.find({
      audioId: id,
      type: "reel",
    })
      .populate({
        path: "user",
        select: "username avatarUrl",
      })
      .sort({ createdAt: -1 })
      .lean();

    

    res.status(200).json(reels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export const getAudioById = catchErrors(async (req: Request, res: Response) => {
  const { id } = req.params;

  const audio = await Audio.findById(id).populate("user", "username avatarUrl userId _id");

  return ResponseUtil.success(res, audio);
});

export const SaveAudio = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId ; // từ middleware verifyToken
    const audioId = req.params.id;

    const existing = await saveAudioModel.findOne({ user: userId, audio: audioId });

    if (existing) {
      // Nếu đã lưu rồi => xóa (unsave)
      await saveAudioModel.deleteOne({ _id: existing._id });
      return res.json({ saved: false, message: "Đã bỏ lưu âm thanh." });
    } else {
      // Nếu chưa lưu => thêm mới
      await saveAudioModel.create({ user: userId, audio: audioId });
      return res.json({ saved: true, message: "Đã lưu âm thanh thành công." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
});

export const checkSavedAudio = catchErrors( async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const audioId = req.params.id;

    const existing = await saveAudioModel.findOne({ user: userId, audio: audioId });

    return res.json({
      saved: !!existing, // true nếu đã lưu, false nếu chưa
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi kiểm tra trạng thái lưu." });
  }
});

export const getAudiosByUser = catchErrors(async (req, res) => {
  const userId = req.userId;

  // Tìm tất cả audio thuộc user đó
  const audios = await Audio.find({ user: userId })
    .sort({ createdAt: -1 }) // sắp xếp mới nhất trước
    .populate("user", "username avatarUrl userId _id");

  return ResponseUtil.success(res, audios);
});


export const getSavedAudiosByUser = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId; 
  console.log("Fetching saved audios for user:", userId);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // 1️⃣ Tìm tất cả các audio mà user đã lưu
  const saved = await saveAudioModel.find({ user: userId }).populate({
    path: "audio",
    populate: { path: "user", select: "userId avatarUrl  _id" }, // Lấy thêm thông tin người đăng âm thanh
  }).sort({ createdAt: -1 });

  // 2️⃣ Lọc ra danh sách audio (vì mỗi document SavedAudio có cả field `audio`)
  const audios = saved.map(item => item.audio).filter(a => a != null);

  // 3️⃣ Trả về kết quả
  return ResponseUtil.success(res, audios);
});

export const deleteAudio = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
 

  // 1️⃣ Tìm audio theo id
  const audio = await Audio.findById(id);

  if (!audio) {
    return res.status(404).json({ message: "Không tìm thấy audio." });
  }


  // 3️⃣ Xóa audio trong database
  await Audio.findByIdAndDelete(id);

  // 4️⃣ Gỡ audioId khỏi tất cả các bài post đang sử dụng audio đó
  await Post.updateMany(
    { audioId: id },
    { $unset: { audioId: "" } }
  );

  // 5️⃣ Xóa khỏi danh sách saveAudioModel (nếu user khác đã lưu)
  await saveAudioModel.deleteMany({ audio: id });

  // 6️⃣ Trả kết quả
  return res.json({ success: true, message: "Đã xóa audio và cập nhật các bài post liên quan." });
});

export const updateAudio = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { title, cover } = req.body;

  // Tìm audio cần cập nhật
  const audio = await Audio.findById(id);
  if (!audio) {
    return res.status(404).json({ success: false, message: "Audio không tồn tại" });
  }
  // Cập nhật các trường được gửi lên
  if (title) audio.title = title;
  if (cover) audio.cover = cover;

  await audio.save();

  return ResponseUtil.success(res, audio, "Cập nhật audio thành công");
});
