

import { 
    toggleBlockHandler,
    getBlockedListHandler
 } from "@/controllers/userBlock.controller";
import { Router } from "express";

const UserBlockRoutes = Router();


UserBlockRoutes.post("/:userId", toggleBlockHandler);

UserBlockRoutes.get("/blocked", getBlockedListHandler);

export default UserBlockRoutes;
