import { useState, useRef, useEffect } from "react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import {
    searchHashtags,
    searchUsers
} from "@/lib/api";


export default function EditPostModal({ isOpen, onClose, post, onSave }) {
    const [caption, setCaption] = useState(post?.caption || "");
    const [likesHidden, setLikesHidden] = useState(post?.likesHidden );
    const [commentsDisabled, setCommentsDisabled] = useState(post?.commentsDisabled );
    const [showPicker, setShowPicker] = useState(false);
    const textareaRef = useRef();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSelecting, setIsSelecting] = useState(false);
    const [search, setSearch] = useState("");
    const [trigger, setTrigger] = useState(null);
    const [suggestions, setSuggestions] = useState([])
    const [tags, setTags] = useState([])
    const [mentionsCap, setMentionsCap] = useState([]);
    const pickerRef = useRef(null);
    const buttonRef = useRef(null);
    console.log(post);
    useEffect(() => {
        const handleClickOutside = (e) => {
            const picker = pickerRef.current;
            const button = buttonRef.current;

            // Nếu click không nằm trong picker và không nằm trên nút emoji → đóng
            if (
                picker &&
                !picker.contains(e.target) &&
                button &&
                !button.contains(e.target)
            ) {
                setShowPicker(false);
            }
        };

        // Dùng "click" thay vì "mousedown" để emoji-mart xử lý chọn emoji trước
        if (showPicker) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showPicker]);


    if (!isOpen) return null;
    const handleSelectHashtag = (hashtag) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;

        const textBeforeCursor = caption.substring(0, cursorPos);
        const match = textBeforeCursor.match(/#[\w\d_]*$/);
        if (!match) return;

        const start = match.index;
        const end = cursorPos;

        const textBefore = caption.substring(0, start);
        const textAfter = caption.substring(end);

        const newText = textBefore + "#" + hashtag.name + " " + textAfter;

        setIsSelecting(true); // ✅ flag bỏ qua handleChange 1 lần
        setCaption(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd =
                textBefore.length + hashtag.name.length + 2;
        }, 0);

        setTags([]); // clear list nhưng không set trigger = null
        setTrigger("hashtag"); // giữ trigger để lần gõ # tiếp theo nhận list ngay
    };

    const handleChange = async (e) => {
        if (isSelecting) {
            setIsSelecting(false);
            return;
        }
        const value = e.target.value;
        setCaption(value);
        const cursorPos = e.target.selectionStart;
        const textUntilCursor = value.substring(0, cursorPos);
        const match = textUntilCursor.trimEnd().match(/([@#])([\w\d_]+)?$/);

        if (match) {
            const symbol = match[1];
            const word = match[2] || "";
            setSearch(word);

            if (symbol === "@") {
                setTrigger("user");
                if (word.length > 0 && word != "") {
                    const res = await searchUsers(word, 1, 20);
                    setSuggestions(res.data || []);
                } else {
                    setSuggestions([]);
                }
            } else if (symbol === "#") {
                setTrigger("hashtag");

                // ✅ Nếu chỉ gõ # mà word rỗng => hiện hashtagSug

                const res = await searchHashtags(word);
                setTags(res.data || []);

            }
        } else {
            setTrigger(null);
            setSuggestions([]);
            setTags([]);
        }
    };

    const handleSelectMentions = (user) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;

        const textBeforeCursor = caption.substring(0, cursorPos);
        const match = textBeforeCursor.match(/@[\w\d_]*$/);
        if (!match) return;

        const start = match.index;
        const end = cursorPos;

        const textBefore = caption.substring(0, start);
        const textAfter = caption.substring(end);

        const newText = textBefore + "@" + user.userId + " " + textAfter;
        setCaption(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd =
                textBefore.length + user.userId.length + 2;
        }, 0);
        setSuggestions([])
        setMentionsCap(prev => {

            if (prev.includes(user.userId)) {
                return prev;
            }
            return [...prev, user.userId];
        });
    };

    const handleSave = () => {
        onSave({
            ...post,
            caption,
            likesHidden,
            commentsDisabled,
        });
        onClose();
    };

    const addEmoji = (emoji) => {
        setCaption((prev) => prev + emoji.native);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-[900px] max-h-[700px] flex overflow-hidden">
                {/* Left: Image preview */}
                <div className="flex-1 bg-gray-50 flex items-center justify-center relative">
                    {post?.mediaUrls && post.mediaUrls.length > 0 ? (
                        <>
                            {/* Lấy link hiện tại */}
                            {(() => {
                                const currentMedia = post.mediaUrls[currentIndex];
                                const url = currentMedia || "";
                                const isVideo = url.toLowerCase().endsWith(".mp4") || url.toLowerCase().includes("video");

                                if (isVideo) {
                                    return (
                                        <video
                                            key={url}
                                            src={url}
                                            controls
                                            className="h-full object-contain"
                                        />
                                    );
                                } else {
                                    return (
                                        <img
                                            key={url}
                                            src={url}
                                            alt={`media-${currentIndex}`}
                                            className="h-full object-contain"
                                        />
                                    );
                                }
                            })()}

                            {/* Nút qua lại */}
                            {post.mediaUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={() =>
                                            setCurrentIndex((prev) =>
                                                prev === 0 ? post.mediaUrls.length - 1 : prev - 1
                                            )
                                        }
                                        className="absolute left-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <button
                                        onClick={() =>
                                            setCurrentIndex((prev) =>
                                                prev === post.mediaUrls.length - 1 ? 0 : prev + 1
                                            )
                                        }
                                        className="absolute right-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Dots hiển thị vị trí */}
                            {post.mediaUrls.length > 1 && (
                                <div className="absolute bottom-3 flex gap-1 justify-center w-full">
                                    {post.mediaUrls.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-2 w-2 rounded-full ${idx === currentIndex ? "bg-white" : "bg-gray-400/70"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-400">Không có hình ảnh hoặc video</p>
                    )}
                </div>


                {/* Right: Edit form */}
                <div className="w-[320px] flex flex-col ">
                    <div className="p-4 flex-1 space-y-4">
                        <div className="flex items-center">
                            <img
                                src={post.user.avatarUrl}
                                alt="avatar"
                                className="w-7 h-7 rounded-full object-cover border"
                            />
                            <span className="ml-2 font-medium">{post.user.userId}</span>
                        </div>
                        <textarea maxLength={220}
                            className="w-full h-35 resize-none p-2 text-sm outline-none border-none focus:outline-none focus:ring-0 focus:border-none"
                            placeholder=""
                            value={caption}
                            ref={textareaRef}
                            onChange={handleChange}
                        />
                        <div className="flex items-center justify-between ">
                            {/* emoji button */}
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    type="button"
                                    onClick={() => setShowPicker((prev) => !prev)}
                                    className="p-1"
                                >
                                    <span className="text-xl">😊</span>
                                </button>

                                {showPicker && (
                                    <div className="absolute top-8 -left-15 z-10">
                                        <div
                                            ref={pickerRef}
                                            className="scale-90 origin-top-left"
                                            onMouseDown={(e) => e.preventDefault()} // quan trọng: ngăn picker mất focus
                                        >
                                            <Picker
                                                data={data}
                                                onEmojiSelect={addEmoji}
                                                theme="light"
                                                previewPosition="none"
                                                navPosition="none"
                                            />
                                        </div>
                                    </div>
                                )}


                            </div>
                            {/* counter */}
                            <span className="text-xs text-gray-500">
                                {caption.length}/{220}
                            </span>
                        </div>
                        <div className="mb-5 border-t -ml-4 border-gray-300"></div>

                        <div className="space-y-6 w-full relative">
                            {/* UI list overlay */}
                            {(suggestions.length > 0 || tags.length > 0) && (
                                <div className="absolute left-0 right-0 top-0 z-50 bg-white shadow-md -ml-4 -mt-5 max-h-60 h-auto overflow-y-auto">
                                    {trigger === "user" &&
                                        suggestions.map((u) => (
                                            <div
                                                key={u._id}
                                                onClick={() => handleSelectMentions(u)}
                                                className="flex items-center gap-2 p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                                            >
                                                <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-sm font-medium">{u.username}</span>
                                                    <span className="text-xs text-gray-500">{u.userId}</span>
                                                </div>

                                            </div>
                                        ))}

                                    {trigger === "hashtag" && (
                                        <>
                                            {/* Hashtags từ DB */}
                                            {tags
                                                .filter((h) => h && typeof h === "object" && h._id) // thêm check h
                                                .map((h) => (
                                                    <div
                                                        key={h._id}
                                                        onClick={() => handleSelectHashtag(h)}
                                                        className="p-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex flex-col"
                                                    >
                                                        <span className="font-bold">#{h.name}</span>
                                                        <span className="text-sm text-gray-500">{h.postCount} bài viết</span>
                                                    </div>
                                                ))}

                                            {/* Hashtags gợi ý sẵn (string) */}

                                        </>
                                    )}

                                </div>
                            )}

                            {/* 2 option luôn nằm trong container */}
                            <div className="space-y-6 w-full mt-4 relative z-0">
                                {/* Ẩn lượt thích */}
                                <div className="flex items-start justify-between">
                                    <div className="mr-3">
                                        <p className="text-sm font-medium">Ẩn lượt thích và lượt xem trên bài viết này</p>
                                        <p className="text-xs text-gray-600">
                                            Chỉ bạn mới nhìn thấy tổng số lượt thích và lượt xem bài viết này.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={likesHidden}
                                        onChange={() => setLikesHidden(!likesHidden)}
                                    />
                                </div>

                                {/* Tắt bình luận */}
                                <div className="flex items-start justify-between">
                                    <div className="mr-3">
                                        <p className="text-sm font-medium">Tắt tính năng bình luận</p>
                                        <p className="text-xs text-gray-600">
                                            Về sau, bạn có thể thay đổi tuỳ chọn này bằng cách mở menu ... ở đầu bài viết.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={commentsDisabled}
                                        onChange={() => setCommentsDisabled(!commentsDisabled)}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className=" p-3 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}
