import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ShareModal({ postId, onClose }) {
  const shareUrl = `${window.location.origin}/post/${postId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert("Đã sao chép liên kết bài viết!");
  };

  const socialLinks = [
    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: "Twitter", url: `https://twitter.com/intent/tweet?url=${shareUrl}` },
    { name: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-neutral-900 w-80 rounded-2xl shadow-lg p-4"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Chia sẻ bài viết</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="space-y-2">
          {socialLinks.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              {s.name}
            </a>
          ))}
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            Sao chép liên kết
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
