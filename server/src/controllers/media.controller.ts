import { Request, Response } from "express";
import { BAD_REQUEST } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import cloudinary from "../config/cloudinary";

// Mở rộng type cho Request khi dùng Multer
export interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Hàm upload 1 file buffer lên Cloudinary
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
export const saveMediaHandler = catchErrors(async (req: MulterRequest, res: Response) => {
  // Chuyển đổi files về mảng
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
