import { Router } from "express";
import { createPostHandler } from "../controllers/post.controller";

const postRoutes= Router()

postRoutes.post("/post/save",createPostHandler);


export default postRoutes