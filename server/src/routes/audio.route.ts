// routes/musicRoutes.js
import { Router } from "express";
import { syncMusic,getAudioList,trimVideoHandler ,getPreviewUrl,
    createAudio,
    checkVideoHasAudioHandler,
    extractAudioHandler
} from "@/controllers/audio.controller";
import upload from "../middleware/upload";

const AudioRoutes =Router();

AudioRoutes.get("/fetch", syncMusic);
AudioRoutes.get("/list", getAudioList);
AudioRoutes.get("/preview/:id", getPreviewUrl);
AudioRoutes.post("/extract", upload.single("video"), extractAudioHandler);
AudioRoutes.post("/create",  createAudio);
AudioRoutes.post("/trim-video", upload.single("video"), trimVideoHandler);
AudioRoutes.post("/check-audio", upload.single("video"), checkVideoHasAudioHandler);

export default AudioRoutes;
