import { Router } from "express";
import { searchAllController } from "../controllers/search.controller";
import authenticate from "@/middleware/authenticate";

const router = Router();
router.get("/", authenticate, searchAllController);

export default router;