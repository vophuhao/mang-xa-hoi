
import { Router } from "express";
import { saveMediaHandler } from "../controllers/media.controller";
import upload from "../middleware/upload";


const mediaRoutes= Router()


mediaRoutes.post("/save", upload.array("files", 10),saveMediaHandler);

export default mediaRoutes