import React, { useEffect, use, useState, useRef } from "react";

import { Heart, MessageCircle, Eye, Play, Pause } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import { checkSavedAudio, fetchPreviewUrl, 
    getAudio, getReelByAudioId, saveAudio } from "@/lib/api";

import PostModal from "./feed/PostModal";


export default function Audio() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reels, setReels] = React.useState([]);
    const [audio, setAudio] = React.useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(null);
    const [isSaved, setIsSaved] = useState(false);

    const { name } = useParams();
    const [selectedPost, setSelectedPost] = useState(null);

    const handleUsernameClick = (username) => {
        navigate(`/${username}`);
    };
    const handleCloseModal = () => {
        setSelectedPost(null);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
    };

    useEffect(() => {
        const fetchAudioSave = async () => {
            try {
                const res = await checkSavedAudio(id);
                setIsSaved(res.saved);
            } catch (error) {
                console.error("Lỗi khi tải audio:", error);
            }
        };

        if (id) fetchAudioSave();
    }, [id]);


    useEffect(() => {
        const fetchAudio = async () => {
            try {
                const res = await getAudio(id);
                setAudio(res.data);
                if (res.data.fileUrl) {
                    setAudioUrl(res.data.fileUrl);
                }
                else {
                    const res = await fetchPreviewUrl(audio.deezerId);
                    setAudioUrl(res.data.previewUrl);
                }
            } catch (error) {
                console.error("Lỗi khi tải audio:", error);
            }
        };

        if (id) fetchAudio();
    }, [id]);

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await getReelByAudioId(id);
                setReels(res);
            } catch (error) {
                console.error("Lỗi khi tải reels:", error);
            }
        };

        if (id) fetchReels();
    }, [id]);


    const handleToggleSave = async () => {
        const res = await saveAudio(id);
        setIsSaved(res.saved);
    };
    // Khi nhạc kết thúc → reset lại icon
    const handleEnded = () => setIsPlaying(false);


    return (
        <div className="max-w-5xl mx-auto p-6 font-sans">
            {/* Header */}
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Âm thanh</h1>

            {/* User info */}
            <div className="flex items-center gap-4 mb-6">
                <img
                    src={audio?.cover || audio?.user?.avatarUrl}
                    alt="avatar"
                    className="w-39 h-39 rounded-xl object-cover mr-4"
                />
                <div>
                    <h2 className="text-lg font-semibold dark:text-white">{audio?.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-white">{audio?.used} thước phim</p>

                    <button
                        onClick={handleToggleSave}
                        className={`mt-2 px-4 py-1 rounded-lg   text-black bg-gray-200 hover:bg-gray-300 w-[400px]
                            }`}
                    >
                        {isSaved ? "Đã lưu" : "Lưu âm thanh"}
                    </button>

                    <div className="flex items-center gap-4 mt-5">
                        {/* Nút Play / Pause */}

                        <audio
                            ref={audioRef}
                            src={audioUrl || ""}
                            controls
                            onEnded={handleEnded}
                            preload="none"
                            style={{ width: "400px" }}
                        />
                    </div>
                </div>
            </div>

            {/* Video list */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reels.map((video) => (
                    <div
                        key={video._id}
                        onClick={() => handlePostClick(video)}
                        className="relative group"
                    >
                        <video
                            src={video.mediaUrls}
                            alt={video.caption}
                            className="object-cover w-full h-100 "
                        />

                        {/* Hiển thị số view ở góc dưới bên trái (luôn thấy) */}
                        <div className="absolute bottom-3 left-4 flex items-center text-white text-sm font-medium drop-shadow">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{video.viewCount} </span>
                        </div>

                        {/* Hiển thị like & comment khi hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-medium rounded-lg">
                            <div className="flex items-center gap-1">
                                <Heart className="h-5 w-5" fill="white" />
                                {video.likeCount}
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageCircle className="h-5 w-5" fill="white" />
                                {video.commentCount}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    isOpen={!!selectedPost}
                    onClose={handleCloseModal}
                    onUsernameClick={handleUsernameClick}
                />
            )}

        </div>
    );
}
