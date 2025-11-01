import { useState, useRef, useEffect } from "react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "rc-slider";
import Draggable from "react-draggable";
import { toast } from "react-toastify";

import ConfirmPopup from "@/components/popup/ConfirmPopup";
import MusicPicker from "@/components/ui/MusicPicker";
import { Toggle } from "@/components/ui/Toggle";
import useAuth from "@/hooks/useAuth";
// eslint-disable-next-line import/order
import {
  analyzeMedia, createPost,
  getAudioList, searchHashtags,
  searchUsers, uploadMedia, trimVideo,
  extracAudio,
  checkVideoHasAudio,
  createAudio,
  fetchPreviewUrl
}
  from "@/lib/api";

import "rc-slider/assets/index.css";





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
  const [mentionsMedia, setMentionsMedia] = useState([]);
  const [mentionsRen, setMentionsRen] = useState([])
  const [mentionsCap, setMentionsCap] = useState([]);
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
  const [trimRange, setTrimRange] = useState([0, 0]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const videoPreviewRef = useRef();
  const draggingRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [audioList, setAudioList] = useState([])
  const [hasOriginalAudio, setHasOriginalAudio] = useState(false);
  const [muteOriginal, setMuteOriginal] = useState(false);
  const [musicObj, setMusicObj] = useState(null);
  const musicPickerAudioRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);


  const handlePlayVideo = () => {
    if (selectedMusic) {
      const bg = new Audio(selectedMusic.previewUrl);
      bg.loop = true;
      bg.play();
      setMusicObj(bg);
    }
  };

  const handlePauseVideo = () => {
    if (musicObj) musicObj.pause();
  };

  const handleStopAll = () => {
    if (musicObj) {
      musicObj.pause();
      setMusicObj(null);
    }
  };

  useEffect(() => {
    const fetchAudioList = async () => {
      const response = await getAudioList();
      setAudioList(response.data);
    }
    fetchAudioList();
  }, []);

  function startDrag(e, handleIdx) {
    e.preventDefault();
    draggingRef.current = handleIdx;
    setIsDragging(true); // Bắt đầu kéo
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  }

  function stopDrag() {
    draggingRef.current = null;
    setIsDragging(false); // Kết thúc kéo
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);

    if (
      videoPreviewRef.current &&
      images[currentIndex]?.type.startsWith("video")
    ) {
      videoPreviewRef.current.pause();
      videoPreviewRef.current.currentTime = trimRange[0];
      setCurrentTime(trimRange[0]);
    }
  }

  function onDrag(e) {
    if (draggingRef.current === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const bar = document.querySelector(".video-trim-bar");
    const rect = bar.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    const value = Math.round(percent * videoDuration);

    setTrimRange(prev => {
      if (draggingRef.current === 0) {
        // Kéo trái, không vượt phải
        return [Math.min(value, prev[1] - 1), prev[1]];
      } else {
        // Kéo phải, không vượt trái
        return [prev[0], Math.max(value, prev[0] + 1)];
      }
    });
  }

  useEffect(() => {
    if (
      step === 2 &&
      images[currentIndex]?.type.startsWith("video") &&
      videoPreviewRef.current
    ) {
      videoPreviewRef.current.currentTime = trimRange[0];
      setCurrentTime(trimRange[0]);
    }
    // eslint-disable-next-line
  }, [step, currentIndex, images]);

  useEffect(() => {
    if (
      images[currentIndex]?.type.startsWith("video") &&
      images[currentIndex].src &&
      videoDuration > 0
    ) {
      generateThumbnails(images[currentIndex].src, videoDuration);
    }
    // eslint-disable-next-line
  }, [images, currentIndex, videoDuration]);

  const generateThumbnails = (videoSrc, duration) => {
    const count = 5;
    const interval = duration / count;
    const tempThumbnails = [];
    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.muted = true;

    video.addEventListener("loadeddata", async () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const thumbW = 160;
      const thumbH = 90;
      // Tính tỉ lệ scale để fit vào thumbnail mà không bị méo
      const scale = Math.min(thumbW / vw, thumbH / vh);
      const drawW = vw * scale;
      const drawH = vh * scale;
      const offsetX = (thumbW - drawW) / 2;
      const offsetY = (thumbH - drawH) / 2;

      for (let i = 0; i < count; i++) {
        video.currentTime = Math.min(i * interval, duration - 0.1);
        await new Promise((resolve) => {
          video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = thumbW;
            canvas.height = thumbH;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#000"; // nền đen nếu không đủ
            ctx.fillRect(0, 0, thumbW, thumbH);
            ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
            tempThumbnails.push(canvas.toDataURL("image/jpeg"));
            resolve();
          };
        });
      }
      setThumbnails(tempThumbnails);
    });
  };
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

    const newText = textBefore + "@" + user.userId + " " + textAfter;
    setCaption(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        textBefore.length + user.userId.length + 2;
    }, 0);
    setSuggestions([])
    setMentionsCap(prev => {
      // Nếu đã có userId thì giữ nguyên, nếu chưa có thì thêm
      if (prev.includes(user.userId)) {
        return prev;
      }
      return [...prev, user.userId];
    });
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
        if (word.length > 0 && word != "") {
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
          console.log(res.data)
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
    const _id = user._id

    const newTag = {
      id: _id,
      username: user.username,
      userId: user.userId,
      x: popup.x,
      y: popup.y,
    };
    setMentionsMedia(prev => {
      // Nếu đã có userId thì giữ nguyên, nếu chưa có thì thêm
      if (prev.includes(user.userId)) {
        return prev;
      }
      return [...prev, user.userId];
    });
    setMentionsRen((prev) => [...prev, newTag]);
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
    setMentionsMedia([]);
    setMentionsCap([]);
    setTags([]);
    setHideLikes(false);
    setDisableComments(false);
    setHashtagSug([]);
    setMentionsRen([]);
    setShowConfirm(false);
    setShowPicker(false);
    setPopup(null);
    setSearch("");
    setSuggestions([]);
    setIsSelecting(false);
    setTrimRange([0, 0]);
    setVideoDuration(0);
    setIsTrimming(false);
    setThumbnails([]);
    setCurrentTime(0);
    setIsDragging(false);
    setSelectedMusic(null);
    setHasOriginalAudio(false);
    setMuteOriginal(false);
    setMusicObj((obj) => {
      if (obj) obj.pause();
      return null;
    });
    if (musicPickerAudioRef.current) {
      musicPickerAudioRef.current.pause();
      musicPickerAudioRef.current = null;
    }
  };

  const handleImageUpload = (e) => {
    const MAX_IMAGE_SIZE_MB = 30; // Giới hạn ảnh
    const MAX_VIDEO_SIZE_MB = 100; // Giới hạn video

    const files = Array.from(e.target.files);

    files.forEach((file) => {
      // Kiểm tra dung lượng
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá ${MAX_IMAGE_SIZE_MB}MB`);
        return;
      }

      if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast.error(`Video "${file.name}" vượt quá ${MAX_VIDEO_SIZE_MB}MB`);
        return;
      }

      // Kiểm tra định dạng hợp lệ
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`"${file.name}" không phải là định dạng ảnh hoặc video hợp lệ`);
        return;
      }

      // Đọc file để hiển thị preview
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { src: reader.result, type: file.type, file },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };



  const extractMentions = (caption) => {
    const regex = /@([^\s@]+)/g; // match @ + tất cả ký tự trừ space và @
    const matches = [];
    let match;
    while ((match = regex.exec(caption)) !== null) {
      matches.push(match[1]);
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
      if (musicPickerAudioRef.current) {
        musicPickerAudioRef.current.pause();
        musicPickerAudioRef.current = null;
      }
      handleStopAll();
      setStep(4);
      setIsPosting(true);
      setPostSuccess(false);
      let audioId = selectedMusic?.deezerId || undefined;
      let audioUrl;
      if (audioId) {
        const res = await fetchPreviewUrl(audioId);
        audioUrl = res.data.previewUrl;
      }
      if (selectedMusic?.fileUrl) {
        audioUrl = selectedMusic.fileUrl;
      }
      let audioOriginal;
      const onlyOneVideo = images.length === 1 && images[0].type && images[0].type.startsWith("video");
      // Nếu chưa chọn nhạc nền, và có video gốc, và không mute, thì tạo audio mới từ video
      if (onlyOneVideo && hasOriginalAudio === true && muteOriginal === false && !audioId) {
        const audioForm = new FormData();
        audioForm.append("video", images[0].file);
        const res = await extracAudio(audioForm);
        const newAudio = await createAudio({
          fileUrl: res.url,
        });
        if (!newAudio.success) {
          toast.error("Tạo thất bại!");
          setStep(3);
          setIsPosting(false);
          return;
        }
        audioOriginal = newAudio.data._id;
      }

      const formData = new FormData();
      images.forEach((img) => formData.append("files", img.file));

      // Truyền đúng các trường hợp audio
      if (muteOriginal && !audioUrl) {
        // Tắt tiếng, không nhạc nền
        formData.append("muteOriginal", "true");
      } else if (muteOriginal && audioUrl) {
        // Tắt tiếng, có nhạc nền
        formData.append("muteOriginal", "true");
        formData.append("audioUrl", audioUrl);
      } else if (!muteOriginal && audioUrl) {
        console.log("audioUrl", audioUrl);
        // Không tắt tiếng, có nhạc nền (mix)
        formData.append("muteOriginal", "false");
        formData.append("audioUrl", audioUrl);
      }
      // Không tắt tiếng, không nhạc nền: không cần append gì thêm

      const imageUrls = await uploadMedia(formData);

      const mentionsFromCaption = extractMentions(caption);
      const mentionsUserCapLast = mentionsCap.filter(id => mentionsFromCaption.includes(id));
      const mentionsUserLast = Array.from(new Set([...mentionsUserCapLast, ...mentionsMedia]));
      const tagsFromCaption = Array.from(new Set(extractHashtags(caption)));

      // Chỉ thêm audioId nếu có
      const postData = {
        mediaUrls: imageUrls.urls,
        caption,
        mentions: mentionsUserLast,
        tagList: tagsFromCaption,
        hideLikes,
        disableComments,
      };
      if (audioId && selectedMusic && selectedMusic._id) {
        postData.audioId = selectedMusic._id;
      }
      else if (audioOriginal) {
        postData.audioId = audioOriginal;
      }

      const result = await createPost(postData);

      if (result.success) {
        setPostSuccess(true);
      } else {
        toast.error("Vui lòng thử lại");
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
      setStep(3);
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
    try {
      setIsProcessing(true); // 🔹 Bắt đầu loading

      if (step === 1 && images[currentIndex]?.type.startsWith("video") && images.length === 1) {
        const formData = new FormData();
        images.forEach((img) => formData.append("video", img.file));
        const res = await checkVideoHasAudio(formData);
        setHasOriginalAudio(res.hasAudio);
      }

      if (step === 1 && (!images[currentIndex].type.startsWith("video") || images.length > 1)) {
        const formData = new FormData();
        images.forEach((img) => formData.append("files", img.file));
        const res = await analyzeMedia(formData);
        setHashtagSug(res.hashtags);
        setStep(3);
        return;
      }

      if (
        step === 2 &&
        images[currentIndex]?.type.startsWith("video") &&
        trimRange[1] - trimRange[0] >= 1
      ) {
        setIsTrimming(true);
        try {
          const formData = new FormData();
          formData.append("video", images[currentIndex].file);
          formData.append("start", trimRange[0].toString());
          formData.append("end", trimRange[1].toString());
          const res = await trimVideo(formData);
          const blob = res;

          const trimmedUrl = URL.createObjectURL(blob);
          const trimmedFile = new File([blob], images[currentIndex].file.name, { type: blob.type });

          const newImages = images.map((img, idx) =>
            idx === currentIndex ? { ...img, file: trimmedFile, src: trimmedUrl } : img
          );
          setImages(newImages);

          const analyzeForm = new FormData();
          newImages.forEach((img) => analyzeForm.append("files", img.file));
          const analyzeRes = await analyzeMedia(analyzeForm);
          setHashtagSug(analyzeRes.hashtags);
        } catch (err) {
          console.error(err);
          setIsTrimming(false);
          return;
        }
        setIsTrimming(false);
      }

      if (step === 2) {
        if (musicPickerAudioRef.current) {
          musicPickerAudioRef.current.pause();
          musicPickerAudioRef.current = null;
        }
        handleStopAll();
      }

      setStep(step + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false); // 🔹 Tắt loading
    }
  };


  return (

    <>
      {isProcessing && (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white ml-3 text-lg font-medium">Đang xử lý...</p>
        </div>
      )}

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
    ${step === 1 || step === 4
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
              {step === 2 && "Tạo bài viết mới"}
              {step === 3 && "Chia sẻ bài viết"}
              {step === 4 && "Chia sẻ bài viết"}
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
            {step === 2 && images.length > 0 && (
              <button
                onClick={handleClickStep}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-semibold cursor-pointer"
                disabled={isTrimming}
              >
                Tiếp
              </button>
            )}
            {step === 3 && (
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
              <div className="flex-1 flex flex-col items-center justify-center text-center relative">
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

                    <p className="text-xl font-medium text-gray-700">
                      Kéo ảnh và video vào đây
                    </p>

                    <label className="bg-blue-600 hover:bg-blue-700 text-white  rounded-lg cursor-pointer font-semibold">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <p className="text-white px-6 py-1 text-lg">Chọn từ máy tính</p>
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-y-auto max-h-[650px]">
                      {images[currentIndex].type.startsWith("video") ? (
                        <video
                          src={images[currentIndex].src}
                          controls
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={handleImageClick}
                        />
                      ) : (
                        <img
                          src={images[currentIndex].src}
                          alt="preview"
                          className="w-full h-full object-cover cursor-pointer"
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
            {/* Bước 3: Caption + mentions */}
            {step === 3 && (
              <div className="flex-1 flex">
                {/* Left: Image */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-y-auto max-h-[650px]">
                  {images.length > 0 && (
                    <>
                      {images[currentIndex].type.startsWith("video") ? (
                        <video
                          src={images[currentIndex].src}
                          controls
                          muted={muteOriginal}
                          onPlay={handlePlayVideo}
                          onPause={handlePauseVideo}
                          onEnded={handlePauseVideo}
                          className="h-full object-cover cursor-pointer"
                          onClick={handleImageClick}
                        />

                      ) : (
                        <img
                          src={images[currentIndex].src}
                          alt="preview"
                          className="w-full h-full object-cover cursor-pointer"
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
                              <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                                {suggestions.map((f) => (
                                  <div
                                    key={f.id}
                                    onClick={() => handleSelect(f)}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    <img
                                      src={f.avatarUrl}
                                      alt=""
                                      className="w-8 h-8 rounded-full"
                                    />
                                    <div className="flex flex-col leading-tight">
                                      <span className="text-sm font-medium">{f.username}</span>
                                      <span className="text-xs text-gray-500">{f.userId}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                            )}
                          </div>
                        </div>
                      )}
                      {/* Render tag trên ảnh */}
                      {mentionsRen.map((tag, i) => (
                        <Draggable
                          key={i}
                          bounds="parent" // chỉ kéo trong ảnh
                          position={{ x: tag.x, y: tag.y }}
                          onStop={(e, data) => {
                            // cập nhật vị trí tag khi kéo xong
                            setMentionsRen((prev) => {
                              const newTags = [...prev];
                              newTags[i] = { ...newTags[i], x: data.x, y: data.y };
                              return newTags;
                            });
                          }}
                        >
                          <div className="absolute flex items-center bg-black/70 font-bold text-white text-xs px-3 py-1.5 rounded cursor-pointer">
                            {/* Tên người dùng */}
                            <span>{tag.userId}</span>

                            {/* Nút xóa */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // tránh trigger drag
                                const userIdToRemove = tag.userId;
                                // Xóa khỏi mentionsCap (object)
                                setMentionsMedia(prev => prev.filter(id => id !== userIdToRemove));
                                // Xóa khỏi mentionsRen (mảng)
                                setMentionsRen(prev => prev.filter(m => m.userId !== userIdToRemove));
                              }}
                              className="ml-3 text-white font-bold text-[10px] cursor-pointer"
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
                      <span className="ml-2 font-medium">{user.data.userId}</span>
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
            {step === 2 && (
              <div className="flex-1 flex">
                {/* Left: Image */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-y-auto max-h-[650px]">
                  {images.length > 0 && (
                    <>
                      {images[currentIndex].type.startsWith("video") ? (
                        <video
                          ref={videoPreviewRef}
                          src={images[currentIndex].src}
                          controls
                          className=" h-full object-cover cursor-pointer"
                          muted={muteOriginal}
                          onClick={handleImageClick}
                          onLoadedMetadata={e => {
                            const duration = Math.floor(e.target.duration);
                            setVideoDuration(duration);
                            setTrimRange([0, duration]);
                            setCurrentTime(0);
                          }}
                          onTimeUpdate={e => {
                            const time = Math.floor(e.target.currentTime);
                            setCurrentTime(time);

                            // Nếu chạm thanh phải thì dừng video
                            if (time >= trimRange[1]) {
                              e.target.pause();
                              e.target.currentTime = trimRange[1];
                            }
                            // Không cho chạy lùi về trước thanh trái
                            if (time < trimRange[0]) {
                              e.target.currentTime = trimRange[0];
                              setCurrentTime(trimRange[0]);
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={images[currentIndex].src}
                          alt="preview"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={handleImageClick}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* trim video */}
                <div className="w-[320px] flex flex-col ">
                  <div className="p-4 flex-1 space-y-4">
                    {/* UI cắt video */}
                    {/* Thanh thumbnails + slider IG style */}
                    {images[currentIndex]?.type.startsWith("video") && videoDuration > 0 && (
                      <div className="mb-4">
                        <div className="font-semibold mb-2">Thu ngắn video</div>
                        <div className="relative h-16 mb-2  overflow-hidden bg-gray-200 flex items-center video-trim-bar">
                          {/* Thumbnails */}
                          {thumbnails.length === 5
                            ? thumbnails.map((thumb, i) => (
                              <div
                                key={i}
                                className="flex-1 h-full border-r last:border-none border-white relative"
                                style={{
                                  backgroundImage: `url(${thumb})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center"
                                }}
                              />
                            ))
                            : [...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-full bg-gray-300 border-r last:border-none border-white"
                              />
                            ))}
                          {/* Overlay vùng không chọn */}
                          {!isDragging && (
                            <div
                              className="absolute top-0 z-40"
                              style={{
                                left:
                                  currentTime < trimRange[0]
                                    ? `${(trimRange[0] / videoDuration) * 100}%`
                                    : currentTime >= trimRange[1]
                                      ? `${(trimRange[1] / videoDuration) * 100}%`
                                      : `${((currentTime / videoDuration) * 100)}%`,
                                height: "100%",
                                width: "4px",
                                background: "#ffffff",
                                transition: "left 0.08s linear"
                              }}
                            />
                          )}
                          <div
                            className="absolute top-0 left-0 h-full pointer-events-none transition-all"
                            style={{
                              width: `${(trimRange[0] / videoDuration) * 100}%`,
                              background: "rgba(0,0,0,0.4)"
                            }}
                          />
                          <div
                            className="absolute top-0 right-0 h-full pointer-events-none transition-all"
                            style={{
                              width: `${((videoDuration - trimRange[1]) / videoDuration) * 100}%`,
                              background: "rgba(0,0,0,0.4)"
                            }}
                          />
                          {/* Thanh trắng trái */}
                          <div
                            className="absolute z-30 cursor-ew-resize"
                            style={{
                              left: `max(calc(${(trimRange[0] / videoDuration) * 100}% - 4px), -4px)`, // dịch nhẹ sang phải, không bị âm quá
                              top: 0,
                              height: "100%"
                            }}
                            onMouseDown={e => startDrag(e, 0)}
                            onTouchStart={e => startDrag(e, 0)}
                          >
                            <div className="w-[8px] h-full bg-white rounded-full shadow border border-blue-400"></div>
                          </div>
                          {/* Thanh trắng phải */}
                          <div
                            className="absolute z-30 cursor-ew-resize"
                            style={{
                              left: `calc(${(trimRange[1] / videoDuration) * 100}% - 4px)`,
                              top: 0,
                              height: "100%"
                            }}
                            onMouseDown={e => startDrag(e, 1)}
                            onTouchStart={e => startDrag(e, 1)}
                          >
                            <div className="w-[8px] h-full bg-white rounded-full shadow border border-blue-400"></div>
                          </div>

                        </div>
                        {/* Số giây dưới mỗi thumbnail */}
                        <div className="flex justify-between px-1 mt-1">
                          {[0, 1, 2, 3, 4].map(i => (
                            <span
                              key={i}
                              className="text-xs text-gray-600 font-semibold"
                              style={{ width: "20%", textAlign: i === 0 ? "left" : i === 4 ? "right" : "center" }}
                            >
                              {Math.round((i * videoDuration) / 4)}s
                            </span>
                          ))}
                        </div>
                        {/* Slider ẩn, chỉ để điều khiển logic */}
                        <Slider
                          range
                          min={0}
                          max={videoDuration}
                          value={trimRange}
                          onChange={setTrimRange}
                          step={1}
                          allowCross={false}
                          trackStyle={[{ background: "transparent", height: 0 }]}
                          handleStyle={[{ opacity: 0, pointerEvents: "none" }, { opacity: 0, pointerEvents: "none" }]}
                          railStyle={{ background: "transparent", height: 0 }}
                        />
                        <div className="flex justify-between text-xs mt-1 text-gray-600 font-medium">
                          <span>{trimRange[0]}s</span>
                          <span>{trimRange[1]}s</span>
                        </div>
                        <MusicPicker
                          audioList={audioList}
                          hasOriginalAudio={hasOriginalAudio}
                          selected={selectedMusic}
                          onSelect={setSelectedMusic}
                          muteOriginal={muteOriginal} // có đang tắt không
                          onToggleOriginal={() => setMuteOriginal(prev => !prev)}
                          audioRef={musicPickerAudioRef}
                        />
                      </div>


                    )}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
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
    </>



  );
}
