import { Request, Response } from "express";
import { BAD_REQUEST } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import cloudinary from "../config/cloudinary";

// mở rộng type cho Request có file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Hàm upload ảnh lên Cloudinary
export const saveImageHandler = catchErrors(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(BAD_REQUEST).json({ message: "Không có file nào được upload" });
  }

  // Promise để chờ upload_stream hoàn thành
  const uploadToCloudinary = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "mang-xa-hoi-image" }, // 👉 có thể bỏ nếu không muốn folder
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject("Upload failed");
          resolve(result.secure_url); // URL ảnh Cloudinary
        }
      );
      stream.end(req.file!.buffer); // dùng `!` vì đã check ở trên
    });
  };

  try {
    const imageUrl = await uploadToCloudinary();
    return res.json({
      message: "Upload thành công",
      url: imageUrl,
    });
  } catch (err) {
    return res.status(500).json({ message: "Upload thất bại", error: err });
  }
});
