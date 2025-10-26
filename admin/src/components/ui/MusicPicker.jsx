import { useState } from "react";

import { fetchPreviewUrl, getAudioList } from "@/lib/api"

import { Toggle } from "./Toggle";

export default function MusicPicker({ audioList, selected, onSelect, hasOriginalAudio,
  muteOriginal,
  onToggleOriginal,
  audioRef
}) {
  const [previewId, setPreviewId] = useState(null);
  const [audioObj, setAudioObj] = useState(null);
  const [list, setList] = useState(audioList || []); // dữ liệu hiển thị
  const [searchKey, setSearchKey] = useState("");

  const handlePlay = async (audio) => {
    if (previewId === audio._id && audioObj) {
      audioObj.pause();
      setPreviewId(null);
      setAudioObj(null);
      if (audioRef) audioRef.current = null;
      return;
    }
    if (audioObj) {
      audioObj.pause();
    }

    let previewUrl = "";
    if (audio && audio.deezerId) {
      // Nhạc Deezer: fetch preview từ API
      const res = await fetchPreviewUrl(audio.deezerId);
      previewUrl = res.data.previewUrl;
    } else if (audio.fileUrl) {
      // Nhạc user upload: lấy fileUrl từ DB
      previewUrl = audio.fileUrl;
    }

    if (previewUrl) {
      const obj = new Audio(previewUrl);
      obj.play();
      setPreviewId(audio._id);
      setAudioObj(obj);
      if (audioRef) audioRef.current = obj;
      onSelect({ ...audio, previewUrl });
      obj.onended = () => {
        setPreviewId(null);
        setAudioObj(null);
        if (audioRef) audioRef.current = null;
      };
    }
  };
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchKey(value);

    if (value.trim() === "") {
      setList(audioList); // reset lại list gốc
      return;
    }

    try {
      const res = await getAudioList(value); // gọi API fetch list theo key
      setList(res.data); // cập nhật list hiển thị
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  return (
    <div className=" mt-5">

      {hasOriginalAudio && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Âm thanh gốc</span>
          <Toggle
            checked={!muteOriginal}
            onChange={onToggleOriginal}
            disabled={false}
          />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">

        <div className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <span role="img" aria-label="music">🎵</span> Chọn nhạc nền
        </div>


        {selected && (
          <button
            type="button"
            onClick={() => {
              if (audioObj) {
                audioObj.pause();
              }
              onSelect(null);
              setAudioObj(null);
              setPreviewId(null); // nhớ clear luôn id để tắt animation sóng
            }}

            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Bỏ chọn
          </button>
        )}
      </div>



      {/* Ô tìm kiếm */}
      <div className="mb-3">
        <input
          type="text"
          value={searchKey}
          onChange={handleSearch}
          placeholder="Tìm bài hát..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Danh sách bài hát */}
      <div className="max-h-60 overflow-y-auto flex flex-col">
        {list.map((audio) => (
          <div
            key={audio._id || audio.id || audio.title}
            onClick={() => handlePlay(audio)}
            className={`w-full p-3 rounded-sm transition cursor-pointer flex items-center gap-3
              ${selected?._id === audio._id ? "bg-blue-50" : "hover:bg-gray-100"}
              ${previewId === audio._id ? "ring-2 ring-blue-300" : ""}
            `}
          >
            {/* Ảnh */}
            <img
              src={audio.cover || audio.user.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border shadow flex-shrink-0"
              referrerPolicy="no-referrer"
            />

            {/* Thông tin bài hát */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {previewId === audio._id && (
                  <div className="flex items-center gap-0.5 h-4">
                    {[...Array(3)].map((_, i) => (
                      <span
                        key={i}
                        className="inline-block w-0.5 bg-blue-500 rounded animate-wave"
                        style={{
                          height: `${6 + i * 4}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div
                  className="font-semibold text-gray-900 truncate"
                  title={audio.title}
                >
                  {audio.title}
                </div>
              </div>
              <div
                className="text-sm text-gray-600 truncate"
                title={audio.artist}
              >
                {audio.artist}
              </div>
            </div>


          </div>
        ))}
      </div>

      {/* Sóng nhạc animation */}
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.8); }
          }
          .animate-wave {
            animation: wave 1s infinite ease-in-out;
          }
        `}
      </style>
    </div>
  );
}
