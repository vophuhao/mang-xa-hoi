import multer from "multer";

const storage = multer.memoryStorage(); // lưu file trong bộ nhớ RAM
const upload = multer({ storage });

export default upload;
