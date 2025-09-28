import { Request, Response } from "express";
import { BAD_REQUEST } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import cloudinary from "../config/cloudinary";
import type { AuthenticatedRequest } from "@/types";
import axios from "axios";
import { CLARIFAI_API_KEY } from "@/constants/env";



// Mở rộng type cho Request khi dùng Multer

const CLARIFAI_MODEL_ID = "general-image-recognition";
const CLARIFAI_MODEL_VERSION_ID = "aa7f35c01e0642fda5cf400f543e7c40"; // ID chính thức của Clarifai
const CLARIFAI_API_URL = `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/versions/${CLARIFAI_MODEL_VERSION_ID}/outputs`;

export interface MulterRequest extends Request {
  // eslint-disable-next-line no-undef
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// ✅ Hàm phân tích ảnh bằng Clarifai (từ buffer)
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
  return concepts
    .slice(0, 20)
    .map((c: any) => c.name.toLowerCase().replace(/\s+/g, ""));
}

// ✅ API Handler
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

// Handler upload nhiều file
export const saveMediaHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  // Chuyển đổi files về mảng
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
    const urls = await Promise.all(filesArray.map(uploadBufferToCloudinary));

    return res.json({
      message: "Upload thành công",
      urls,
    });
  } catch (err) {
    return res.status(500).json({ message: "Upload thất bại", error: err });
  }
});


