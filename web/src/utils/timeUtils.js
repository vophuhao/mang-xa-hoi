/**
 * Format last online time to Vietnamese
 * @param {Date|string} lastOnline - Last online timestamp
 * @returns {string} Formatted string like "5 phút trước", "2 giờ trước", etc.
 */
export const formatLastOnline = (lastOnline) => {
  if (!lastOnline) return "Không xác định";
  
  const now = new Date();
  const lastOnlineDate = new Date(lastOnline);
  const diffMs = now.getTime() - lastOnlineDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return "Vừa truy cập";
  } else if (diffMinutes < 60) {
    return `Truy cập ${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `Truy cập ${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `Truy cập ${diffDays} ngày trước`;
  } else {
    return `Truy cập ${lastOnlineDate.toLocaleDateString('vi-VN')}`;
  }
};

/**
 * Check if user was recently online (within last 5 minutes)
 * @param {Date|string} lastOnline 
 * @returns {boolean}
 */
export const wasRecentlyOnline = (lastOnline) => {
  if (!lastOnline) return false;
  const now = new Date();
  const lastOnlineDate = new Date(lastOnline);
  const diffMs = now.getTime() - lastOnlineDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes <= 5;
};