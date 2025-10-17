import { useState, useEffect } from "react";

import { X } from "lucide-react";

import { uploadMedia, updateAudio } from "@/lib/api";

export default function EditAudioModal({ audio, onClose, onSave }) {
  const initialCover = audio.cover || audio.user?.avatarUrl || "";

  const [title, setTitle] = useState(audio.title || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialCover);
  const [loading, setLoading] = useState(false);

  // Khi chọn file mới => hiển thị preview ngay
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Reset khi audio thay đổi
  useEffect(() => {
    const newCover = audio.cover || audio.user?.avatarUrl || "";
    setTitle(audio.title || "");
    setPreview(newCover);
    setFile(null);
  }, [audio]);

  // 🟢 Hàm lưu thay đổi
  const handleSubmit = async () => {
    try {
      setLoading(true);

      let coverUrl = audio.cover; // mặc định giữ nguyên cover cũ

      // Nếu có file mới thì upload trước
      if (file) {
        const formData = new FormData();
        formData.append("files", file);

        const resUpload = await uploadMedia(formData);
        if (resUpload.urls) {
          coverUrl = resUpload.urls[0];
        } else {
          alert("Không thể upload ảnh!");
          setLoading(false);
          return;
        }
      }

      // Sau đó gọi API cập nhật audio
      const updateRes = await updateAudio(audio._id, {
        title,
        cover: coverUrl,
      });

      if (updateRes.success) {
        onSave(updateRes.data); // cập nhật UI
        onClose(); // đóng modal
      } else {
        alert("Cập nhật thất bại!");
      }
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      alert("Đã xảy ra lỗi khi lưu thay đổi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Chỉnh sửa âm thanh
        </h2>

        <div className="space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Tên
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Ảnh bìa */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Ảnh bìa
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm"
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="w-24 h-24 mt-3 rounded-md object-cover border border-gray-300 dark:border-gray-700"
              />
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
