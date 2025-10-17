// routes/musicRoutes.js
import { Router } from "express";
import { syncMusic,getAudioList,trimVideoHandler ,getPreviewUrl,
    createAudio,
    checkVideoHasAudioHandler,
    extractAudioHandler,
    getAllReelPostsByAudio,
    getAudioById,
    SaveAudio,
    checkSavedAudio,
    getAudiosByUser,
    getSavedAudiosByUser,
    deleteAudio,updateAudio
} from "@/controllers/audio.controller";
import upload from "../middleware/upload";

const AudioRoutes =Router();

AudioRoutes.get("/fetch", syncMusic);
AudioRoutes.get("/list", getAudioList);
AudioRoutes.get("/list/userSave", getAudiosByUser);
AudioRoutes.delete("/delete/:id", deleteAudio);
AudioRoutes.get("/saved/list", getSavedAudiosByUser);
AudioRoutes.get("/preview/:id", getPreviewUrl);
AudioRoutes.post("/extract", upload.single("video"), extractAudioHandler);
AudioRoutes.post("/create",  createAudio);
AudioRoutes.post("/trim-video", upload.single("video"), trimVideoHandler);
AudioRoutes.post("/check-audio", upload.single("video"), checkVideoHasAudioHandler);
AudioRoutes.get("/:id/reels", getAllReelPostsByAudio);
AudioRoutes.get("/:id", getAudioById);
AudioRoutes.post("/save/:id", SaveAudio);
AudioRoutes.get("/check-saved/:id", checkSavedAudio);
AudioRoutes.put("/update/:id", updateAudio);

export default AudioRoutes;
