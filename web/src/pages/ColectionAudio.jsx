import { useEffect, useState } from "react";

import { ArrowLeft, Play, Pause, MoreVertical } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { getAudioByUser , deleteAudio} from "@/lib/api"; // ✅ cần có 2 API này
import EditAudioModal from "@/modals/EditAudioModal";



const CollectionAudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [myAudios, setMyAudios] = useState([]);
  const [audioObj, setAudioObj] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [activeTab, setActiveTab] = useState("my");

  // menu + modal state
  const [menuOpen, setMenuOpen] = useState(null);
  const [editAudio, setEditAudio] = useState(null);

  const allAudios = location.state?.audios || [];
  const currentList = activeTab === "saved" ? allAudios : myAudios;

  // 🔹 Lấy danh sách audio của user
  useEffect(() => {
    const fetchMyAudios = async () => {
      const res = await getAudioByUser();
      if (res.success) setMyAudios(res.data);
    };
    fetchMyAudios();
  }, []);

  // 🔹 Cleanup khi rời trang → dừng nhạc
  useEffect(() => {
    return () => {
      if (audioObj) audioObj.pause();
    };
  }, [audioObj]);

  const handleBack = () => navigate(-1);

  // 🔹 Phát / dừng nhạc
  const handlePlay = (audio) => {
    if (playingId === audio._id && audioObj) {
      audioObj.pause();
      setPlayingId(null);
      setAudioObj(null);
      return;
    }
    if (audioObj) audioObj.pause();

    const newAudio = new Audio(audio.fileUrl);
    newAudio.play();
    setPlayingId(audio._id);
    setAudioObj(newAudio);
    newAudio.onended = () => {
      setPlayingId(null);
      setAudioObj(null);
    };
  };

  // 🔹 Xử lý xóa audio
  const handleDelete = async (audioId) => {
    if (!window.confirm("Bạn có chắc muốn xóa âm thanh này?")) return;
    const res = await deleteAudio(audioId);
    if (res.success) {
      setMyAudios((prev) => prev.filter((a) => a._id !== audioId));
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Âm thanh
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-5 gap-100">
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-2 font-medium transition-colors duration-200 ${
            activeTab === "saved"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          } inline-block`}
        >
          Âm thanh đã lưu
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`pb-2 font-medium transition-colors duration-200 ${
            activeTab === "my"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          } inline-block`}
        >
          Âm thanh của tôi
        </button>
      </div>

      {/* Danh sách audio */}
      <div className="space-y-4">
        {currentList.length > 0 ? (
          currentList.map((audio) => (
            <div
              key={audio._id}
              className="relative ml-40 mt-10 flex items-center justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-2"
            >
              <div
                onClick={() => navigate(`/audio/${audio._id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <img
                  src={audio.cover || audio.user?.avatarUrl}
                  alt={audio.title}
                  className="w-14 h-14 rounded-md object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {audio.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {audio.artist || "Không rõ"} • {audio.duration || "0:00"}
                  </p>
                </div>
              </div>

              {/* Play / Pause + Menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlay(audio)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {playingId === audio._id ? (
                    <Pause className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  )}
                </button>

               {
                activeTab === "my" && (
                   <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === audio._id ? null : audio._id)
                    }
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>

                  {menuOpen === audio._id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => {
                          setEditAudio(audio);
                          setMenuOpen(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDelete(audio._id)}
                        className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
                )}
               
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {activeTab === "my"
              ? "Bạn chưa tạo âm thanh nào"
              : "Không có âm thanh nào được lưu"}
          </p>
        )}
      </div>

      {/* Modal chỉnh sửa */}
      {editAudio && (
        <EditAudioModal
          audio={editAudio}
          onClose={() => setEditAudio(null)}
          onSave={(updated) => {
            setMyAudios((prev) =>
              prev.map((a) => (a._id === updated._id ? updated : a))
            );
            setEditAudio(null);
          }}
        />
      )}
    </div>
  );
};

export default CollectionAudio;
