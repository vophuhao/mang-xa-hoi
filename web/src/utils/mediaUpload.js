import API from "@/config/apiClient";

export const uploadMedia = async (files) => {
  const formData = new FormData();

  // Nếu là một file duy nhất, chuyển thành mảng
  const fileArray = Array.isArray(files) ? files : [files];

  fileArray.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await API.post("/media/save", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.urls;
  } catch (error) {
    console.error("Media upload failed:", error);
    throw error;
  }
};

export const analyzeMedia = async (files) => {
  const formData = new FormData();

  // Nếu là một file duy nhất, chuyển thành mảng
  const fileArray = Array.isArray(files) ? files : [files];

  fileArray.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await API.post("/media/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.hashtags;
  } catch (error) {
    console.error("Media analysis failed:", error);
    throw error;
  }
};
