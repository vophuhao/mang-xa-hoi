import { useState, useRef, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { Toggle } from "@/components/ui/Toggle";
import { analyzeMedia, createPost, searchHashtags, searchUsers, uploadMedia } from "@/lib/api";
import Draggable from "react-draggable";
import { toast } from "react-toastify";
import ConfirmPopup from "@/components/popup/ConfirmPopup";
export default function CreatePostModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]); // nhiều ảnh
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [disableComments, setDisableComments] = useState(false);
  const [popup, setPopup] = useState(null); // {x,y}
  const [search, setSearch] = useState("");
  const [mentions, setMentions] = useState([]);
  const [mentionsCap, setMentionsCap] = useState({});
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const [trigger, setTrigger] = useState(null);
  const textareaRef = useRef(null);
  const [tags, setTags] = useState([])
  const [hashtagSug, setHashtagSug] = useState([])
  const maxLength = 220;
  const [isSelecting, setIsSelecting] = useState(false);
  // Hàm chọn user
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

    const newText = textBefore + "@" + user.username + " " + textAfter;
    setCaption(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        textBefore.length + user.username.length + 2;
    }, 0);
    setSuggestions([])
    setMentionsCap((prev) => ({ ...prev, [user.username]: user._id }));

  };
  
  const handleSelectHashtagSug = (hashtag) => {
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

    const newText = textBefore + "#" + hashtag + " " + textAfter;

    setIsSelecting(true); // tránh handleChange vô tình clear list
    setCaption(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        textBefore.length + hashtag.length + 2;

      setIsSelecting(false); // ✅ reset để lần gõ tiếp theo nhận bình thường
    }, 0);

    setTrigger(null);
    setTags([]);
  };



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
        if (word.length > 0) {
          const res = await searchUsers(word, 1, 20);
          setSuggestions(res.data || []);
        } else {
          setSuggestions([]);
        }
      } else if (symbol === "#") {
        setTrigger("hashtag");

        // ✅ Nếu chỉ gõ # mà word rỗng => hiện hashtagSug
        if (word.length === 0) {
          setTags(hashtagSug); // show gợi ý luôn
        } else {
          const res = await searchHashtags(word);
          setTags(res.data || []);
        }
      }
    } else {
      setTrigger(null);
      setSuggestions([]);
      setTags([]);
    }
  };


  useEffect(() => {
    if (search.trim()) {
      const fetchUsers = async () => {
        try {
          // Loại bỏ ký tự @ ở đầu nếu có
          const cleanQuery = search.startsWith("@") ? search.slice(1) : search;
          const res = await searchUsers(cleanQuery, 1, 20);
          setSuggestions(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsers();
    } else {
      setSuggestions([]);
    }
  }, [search]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null); // bấm ra ngoài thì đóng popup
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // khi click ảnh
  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // chọn bạn bè
  const handleSelect = (user) => {
    if (!popup) return;

    // MongoDB dùng _id
    const userId = user._id

    const newTag = {
      id: userId,
      username: user.username,
      x: popup.x,
      y: popup.y,
    };

    setMentions((prev) => [...prev, newTag]);
    setPopup(null);
    setSearch("");
    setSuggestions([])
  };

  if (!isOpen) return null;
  // trong component
  // Hàm addEmoji
  const addEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = caption.slice(0, start) + emoji.native + caption.slice(end);

    setCaption(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.native.length;
    }, 0);

    // picker vẫn mở, không setShowPicker(false)
  };

  const resetModal = () => {
    setStep(1);
    setImages([]);
    setCurrentIndex(0);
    setCaption("");
    setMentions([]);
    setMentionsCap({}),
      setTags([]);
    setHideLikes(false);
    setDisableComments(false),
      setHashtagSug([])
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { src: reader.result, type: file.type, file } // Lưu file ở đây
        ]);
      };
      reader.readAsDataURL(file);
    });
  };


  const extractMentions = (caption) => {
    const regex = /@(\w+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(caption)) !== null) {
      matches.push(match[1]); // lấy username
    }
    return matches;
  };

const extractHashtags = (caption) => {
  const regex = /#(\w+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(caption)) !== null) {
    matches.push(match[1]);
  }
  // Loại trùng
  return Array.from(new Set(matches));
};



  const handlePost = async () => {
    try {
      setStep(3);
      setIsPosting(true);
      setPostSuccess(false);

      const formData = new FormData();
      images.forEach((img) => formData.append("files", img.file));
      const imageUrls = await uploadMedia(formData);

      // --- Lấy mentions từ caption ---
      const mentionUsernames = extractMentions(caption); // ["hao", "linh", ...]
      // mentionsCap là map username -> user object { _id, username, ... }
      const mentionsFromCaption = mentionUsernames
        .map((username) => mentionsCap[username])
        .filter(Boolean); // chỉ lấy user thực sự có trong map

      // --- Lấy hashtags ---
      const tagsFromCaption = Array.from(new Set(extractHashtags(caption)));

      // --- Lấy user ID từ tag trên ảnh ---
      const userIdsFromImageTags = mentions.map(tag => tag._id);

      // --- Lấy user ID từ mentions trong caption ---
      const userIdsFromCaption = mentionsFromCaption.map(user => user._id);

      // --- Gộp 2 nguồn và loại trùng ---
      const uniqueUserIds = Array.from(new Set([...userIdsFromImageTags, ...userIdsFromCaption]));
      console.log(uniqueUserIds)
      // --- Chuẩn bị postData ---
      const postData = {
        mediaUrls: imageUrls.urls,
        caption,
        mentions: uniqueUserIds, // danh sách duy nhất
        tagList: tagsFromCaption,
        hideLikes,
        disableComments,
      };

      const result = await createPost(postData);

      if (result.success) {
        setPostSuccess(true);
        setCaption("");
        setMentions([]);      // xóa tag trên ảnh
        setMentionsCap({});   // xóa map mentions trong caption
      } else {
        toast.error("Vui lòng thử lại");
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
      setStep(2);
    } finally {
      setIsPosting(false);
    }
  };





  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      resetModal();
      onClose();
    }
  };

  const handleReturn = () => {
    setShowConfirm(true)
  }

  const handleCloseClick = () => {
    resetModal();
    onClose();
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleClickStep = async () => {
    const formData = new FormData();
    images.forEach((img) => formData.append("files", img.file));
    const res = await analyzeMedia(formData)
    console.log(res)
    setHashtagSug(res.hashtags)

    setStep(2)
  }
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      {/* ❌ Nút đóng */}
      <button
        onClick={handleCloseClick}
        className="absolute top-4 right-4 p-2 rounded-full cursor-pointer"
      >
        <X size={22} color="white" />
      </button>

      <div
        className={`bg-white rounded-2xl flex flex-col shadow-xl overflow-hidden transition-all duration-300
    w-[95%] h-[90vh] max-h-[600px]  // 👈 mặc định cho mobile
    ${step === 1 || step === 3
            ? "sm:w-[550px] sm:h-[650px]"
            : "sm:w-[900px] sm:h-[650px]"}  
  `}
      >
        {/* Header */}
        <div className="relative flex justify-center items-center border-b border-gray-200 px-4 py-2">
          {/* 🔙 Back button ở bước 2 */}
          {step === 2 && (
            <button
              onClick={() => handleReturn()}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}


          <h2 className="font-semibold">
            {step === 1 && "Tạo bài viết mới"}
            {step === 2 && "Chia sẻ bài viết"}
            {step === 3 && "Chia sẻ bài viết"}
          </h2>

          {/* 👉 nút Tiếp / Chia sẻ */}
          {step === 1 && images.length > 0 && (
            <button
              onClick={handleClickStep}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-semibold cursor-pointer"
            >
              Tiếp
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handlePost}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-semibold cursor-pointer"
            >
              Chia sẻ
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Bước 1: Chọn ảnh */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
              {images.length === 0 ? (
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v-9A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v9a2.25 2.25 0 0 1-2.25 2.25h-13.5A2.25 2.25 0 0 1 3 16.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 10.5l3 3 3-3"
                    />
                  </svg>

                  <p className="text-lg font-medium text-gray-700">
                    Kéo ảnh và video vào đây
                  </p>

                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    Chọn từ máy tính
                  </label>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-y-auto max-h-[650px]">
                    {images[currentIndex].type.startsWith("video") ? (
                      <video
                        src={images[currentIndex].src}
                        controls
                        className="h-full w-auto object-contain cursor-pointer"
                        onClick={handleImageClick}
                      />
                    ) : (
                      <img
                        src={images[currentIndex].src}
                        alt="preview"
                        className="h-full w-auto object-contain cursor-pointer"
                        onClick={handleImageClick}
                      />
                    )}
                  </div>
                  {/* Nút prev/next */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
                      >
                        <ChevronLeft size={17} color="white" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
                      >
                        <ChevronRight size={17} color="white" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          {/* Bước 2: Caption + mentions */}
          {step === 2 && (
            <div className="flex-1 flex">
              {/* Left: Image */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-y-auto max-h-[650px]">
                {images.length > 0 && (
                  <>
                    {images[currentIndex].type.startsWith("video") ? (
                      <video
                        src={images[currentIndex].src}
                        controls
                        className="h-full w-auto object-contain cursor-pointer"
                        onClick={handleImageClick}
                      />

                    ) : (
                      <img
                        src={images[currentIndex].src}
                        alt="preview"
                        className="h-full w-auto object-contain cursor-pointer"
                        onClick={handleImageClick}
                      />
                    )}

                    {/* Popup tag bạn bè */}
                    {popup && (
                      <div
                        ref={popupRef}
                        className="absolute bg-white rounded-lg shadow-lg border-rounded border-gray-200 w-83 z-50 h-55"
                        style={{ top: popup.y, left: popup.x }}
                      >
                        {/* Mũi nhọn */}
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold">Thẻ:</p>
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Tìm kiếm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-gray-50 w-full border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                              {search && (
                                <button
                                  onClick={() => setSearch("")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {search && (
                            <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                              {suggestions.length > 0 ? (
                                suggestions.map((f) => (
                                  <div
                                    key={f.id}
                                    onClick={() => handleSelect(f)}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    <img src={f.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                    <div>
                                      <p className="text-sm font-medium">{f.username}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 p-2">Không tìm thấy</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Render tag trên ảnh */}
                    {mentions.map((tag, i) => (
                      <Draggable
                        key={i}
                        bounds="parent" // chỉ kéo trong ảnh
                        position={{ x: tag.x, y: tag.y }}
                        onStop={(e, data) => {
                          // cập nhật vị trí tag khi kéo xong
                          setMentions((prev) => {
                            const newTags = [...prev];
                            newTags[i] = { ...newTags[i], x: data.x, y: data.y };
                            return newTags;
                          });
                        }}
                      >
                        <div className="absolute flex items-center bg-black/70 font-bold text-white text-xs px-3 py-1.5 rounded cursor-pointer">
                          {/* Tên người dùng */}
                          <span>{tag.username}</span>

                          {/* Nút xóa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // tránh trigger drag
                              setMentions((prev) => prev.filter((_, idx) => idx !== i));
                            }}
                            className="ml-3 text-white font-bold text-[10px] cursor-pointer "
                          >
                            ✕
                          </button>

                        </div>
                      </Draggable>
                    ))}

                    {/* Nút điều hướng ảnh */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
                        >
                          <ChevronLeft size={17} color="white" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full"
                        >
                          <ChevronRight size={17} color="white" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Right: Caption + mentions */}
              <div className="w-[320px] flex flex-col ">
                <div className="p-4 flex-1 space-y-4">
                  <div className="flex items-center">
                    <img
                      src={user.data.avatarUrl}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover border"
                    />
                    <span className="ml-2 font-medium">{user.data.username}</span>
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
                      {caption.length}/{maxLength}
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
                              <span className="text-sm">{u.username}</span>
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
                            {tags
                              .filter((h) => typeof h === "string")
                              .map((h, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleSelectHashtagSug(h)}
                                  className="p-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex flex-col"
                                >
                                  <span className="">#{h}</span>
                                  <span className="text-sm text-gray-500">Gợi ý</span>
                                </div>
                              ))}
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
                          checked={hideLikes}
                          onChange={() => setHideLikes(!hideLikes)}
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
                          checked={disableComments}
                          onChange={() => setDisableComments(!disableComments)}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
              <div className="flex justify-center items-center">
                {isPosting && (
                  <div className="w-20 h-20 border-[4px] border-transparent  border-t-[#feda75] border-r-[#d62976] border-b-[#962fbf] border-l-[#4f5bd5] rounded-full animate-spin">

                  </div>
                )}

                {postSuccess && (
                  <img src="https://static.cdninstagram.com/rsrc.php/v4/yb/r/sHkePOqEDPz.gif"></img>
                )}
              </div>
              <h2 className="text-[20px] font-semibold text-[#262626] mt-8">
                {postSuccess
                  ? "Đã chia sẻ bài viết của bạn."
                  : ""}
              </h2>
            </div>
          )}
        </div>
      </div>
      <ConfirmPopup
        show={showConfirm}
        onConfirm={() => {
          setShowConfirm(false);
          resetModal();
        }}
        onCancel={() => setShowConfirm(false)}
      />

    </div>

  );
}
