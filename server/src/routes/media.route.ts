
import { Router } from "express";
import { analyzeMediaHandler, saveMediaHandler } from "../controllers/media.controller";
import upload from "../middleware/upload";


const mediaRoutes= Router()


mediaRoutes.post("/save", upload.array("files", 10),saveMediaHandler);
mediaRoutes.post("/analyze", upload.array("files",10), analyzeMediaHandler);

export default mediaRoutes