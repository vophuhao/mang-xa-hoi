import { useState, useEffect, useRef } from "react";

import { toast } from "react-toastify";

import SidebarSetting from "@/components/SidebarSetting";
import { getUser, updateProfile } from "@/lib/api";

export default function EditProfile({ onCancel }) {
  const [activeSetting, setActiveSetting] = useState("edit");
  const [form, setForm] = useState({
    name: "",
    username: "",
    website: "",
    bio: "",
    avatarUrl: "",
    gender: "prefer_not_to_say",
    showSuggestions: true,
  });
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    getUser().then((res) => {
      const userData = {
        name: res.data.name || "",
        username: res.data.username || "",
        website: res.data.website || "",
        bio: res.data.bio || "",
        avatarUrl: res.data.avatarUrl || "",
        gender: res.data.gender || "prefer_not_to_say",
        showSuggestions: res.data.showSuggestions !== undefined ? res.data.showSuggestions : true,
      };
      setForm(userData);
      setInitialForm(userData);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("files", file);

    try {
      setLoading(true);
      const res = await import("@/lib/api").then((api) => api.uploadMedia(formData));
      const url = res.urls?.[0]; 
      if (!url) {
        toast.error("Không nhận được URL ảnh từ server");
        return;
      }
      setForm({ ...form, avatarUrl: url });

      await updateProfile({
        username: form.username,
        bio: form.bio,
        avatarUrl: url,
        gender: form.gender,
      });

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("upload error:", err);
      toast.error("Lỗi khi upload ảnh!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuggestions = () => {
    setForm((prev) => ({ ...prev, showSuggestions: !prev.showSuggestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usernameRegex = /^[a-zA-Z0-9_ ]+$/;
    if (form.username && !usernameRegex.test(form.username)) {
      toast.error("Tên người dùng chỉ được chứa chữ, số và dấu gạch dưới (_).");
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        username: form.username,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        gender: form.gender,
      });
      toast.success("Cập nhật thành công!");
      if (onCancel) onCancel();
    } catch (err) {
      toast.error(
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        "Cập nhật thất bại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const isChanged = initialForm && (
    form.name !== initialForm.name ||
    form.username !== initialForm.username ||
    form.website !== initialForm.website ||
    form.bio !== initialForm.bio ||
    form.avatarUrl !== initialForm.avatarUrl ||
    form.gender !== initialForm.gender ||
    form.showSuggestions !== initialForm.showSuggestions
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black">
      <SidebarSetting activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
      <main className="flex-1 px-8 py-10">
        {activeSetting === "edit" && (
          <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto">
            {/* Avatar, tên, username, đổi ảnh */}
            <div className="flex items-center mb-8 bg-gray-100 dark:bg-[#232323] rounded-xl p-6">
              <img
                src={form.avatarUrl || "/default-avatar.png"}
                alt="avatar"
                className="w-14 h-14 rounded-full object-cover mr-4 border"
              />
              <div>
                <div className="font-semibold text-base text-black dark:text-white">{form.username}</div>
                <div className="text-gray-500 dark:text-gray-300 text-sm">{form.name}</div>
                <button
                  type="button"
                  className="mt-2 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition"
                  onClick={() => fileInputRef.current.click()}
                >
                  Change photo
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            {/* Website */}
            <div>
              <label className="block font-medium mb-1 text-sm text-black dark:text-white">Website</label>
              <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                Editing your links is only available on mobile...
              </div>
            </div>
            {/* Bio */}
            <div>
              <label className="block font-medium mb-1 text-sm text-black dark:text-white">Giới thiệu</label>
              <div className="relative">
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-black dark:text-white bg-gray-100 dark:bg-[#232323] focus:outline-none resize-none"
                  maxLength={150}
                  placeholder="Giới thiệu về bạn"
                  rows={2}
                />
                <div className="absolute bottom-2 right-4 text-xs text-gray-400">{form.bio.length} / 150</div>
              </div>
            </div>
            {/* Gender */}
            <div>
              <label className="block font-medium mb-1 text-sm text-black dark:text-white">Giới tính</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-[#232323] text-base text-black dark:text-white focus:outline-none"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Thông tin này sẽ không hiển thị công khai trên trang cá nhân của bạn.
              </div>
            </div>
            {/* Show account suggestions */}
            <div>
              <label className="block font-medium mb-1 text-sm text-black dark:text-white">
                Hiển thị gợi ý tài khoản trên trang cá nhân
              </label>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#232323]">
                <div className="flex-1">
                  <div className="block font-medium mb-1 text-sm text-black dark:text-white">Hiển thị gợi ý tài khoản trên trang cá nhân</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    Chọn cho phép mọi người thấy các gợi ý tài khoản tương tự trên trang cá nhân của bạn, và tài khoản của bạn có thể được gợi ý trên trang cá nhân khác.
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={handleToggleSuggestions}
                  className={`ml-8 w-12 h-7 flex items-center rounded-full transition-colors duration-200 ${
                    form.showSuggestions ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  aria-pressed={form.showSuggestions}
                >
                  <span
                    className={`inline-block w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                      form.showSuggestions ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
            {/* Info note */}
            <div className="text-gray-500 text-xs mt-4">
              Một số thông tin như tên, giới thiệu, liên kết sẽ hiển thị công khai.{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Xem thông tin hiển thị công khai
              </a>
            </div>
            {/* Submit */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                type="submit"
                className={`flex-1 font-bold py-2 rounded-xl text-base transition disabled:opacity-60
                  ${isChanged ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-blue-200 text-white"}
                `}
                disabled={!isChanged || loading}
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 rounded-xl text-base transition"
                onClick={onCancel}
              >
                Quay lại
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}