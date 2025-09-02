
import { Router } from "express";
import { saveImageHandler } from "../controllers/media.controller";
import upload from "../middleware/upload";


const mediaRoutes= Router()


mediaRoutes.post("/image/save",upload.single("file"),saveImageHandler);

export default mediaRoutes