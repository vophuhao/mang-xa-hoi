import { useState } from "react"
import { saveImage, savePost } from "../lib/api"
import { toast } from "react-toastify"

export default function CreatePostModal({ isOpen, onClose }) {
    const [file, setFile] = useState(null);
    const [rawFile, setRawFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(URL.createObjectURL(selectedFile));
            setRawFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        if (!rawFile) {
            toast.error("Vui lòng chọn ảnh!");
            return;
        }
        if (!caption.trim()) {
            toast.error("Vui lòng nhập caption!");
            return;
        }
        setLoading(true);
        try {
            // 1. Upload ảnh
            const formData = new FormData();
            formData.append("file", rawFile);
            const uploadRes = await saveImage(formData);
            const imageUrl = uploadRes.url;
            // 2. Lưu bài post
            const postRes = await savePost(caption, imageUrl);
            console.log(postRes)
            if (postRes?.status === 200) {
                toast.success("Đăng bài thành công!");
                onClose();
                setCaption("");
                setFile(null);
                setRawFile(null);
            } else {
                toast.error("Đăng bài thất bại!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi đăng bài!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[480px] p-5 flex flex-col gap-4">
                {/* Caption */}
                <textarea
                    className="border rounded-xl p-3 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Viết caption..."
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />
                {/* Upload zone */}
                {!file ? (
                    <label className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-gray-50 transition">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <p className="text-gray-600">Kéo ảnh hoặc video vào đây</p>
                        <span className="text-blue-500 mt-2">Chọn từ máy tính</span>
                    </label>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <img src={file} alt="preview" className="max-h-60 rounded-lg" />
                        <button
                            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                            onClick={() => {
                                setFile(null);
                                setRawFile(null);
                            }}
                        >
                            Chọn lại
                        </button>
                    </div>
                )}

                {/* Post button */}
                {file && (
                    <button
                        className="bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600 transition disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Đang đăng..." : "Đăng bài"}
                    </button>
                )}
            </div>
        </div>
    );
}
