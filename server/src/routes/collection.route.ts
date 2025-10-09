import {
  addPostToCollectionHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  getCollectionByIdHandler,
  getCollectionPostsHandler,
  getCollectionsHandler,
  movePostToCollectionHandler,
  removePostFromCollectionHandler,
  updateCollectionHandler,
} from "@/controllers/collection.controller";
import { Router } from "express";

const collectionRoutes = Router();

// Collection CRUD operations
collectionRoutes.post("/", createCollectionHandler);
collectionRoutes.get("/", getCollectionsHandler);
collectionRoutes.get("/:id", getCollectionByIdHandler);
collectionRoutes.put("/:id", updateCollectionHandler);
collectionRoutes.delete("/:id", deleteCollectionHandler);

// Collection post management
collectionRoutes.get("/:id/posts", getCollectionPostsHandler);
collectionRoutes.post("/:id/posts/:postId", addPostToCollectionHandler);
collectionRoutes.delete("/:id/posts/:postId", removePostFromCollectionHandler);
collectionRoutes.put("/:fromId/posts/:postId/move/:toId", movePostToCollectionHandler);

export default collectionRoutes;
