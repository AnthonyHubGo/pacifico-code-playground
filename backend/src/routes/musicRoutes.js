// backend/src/routes/musicRoutes.js
import { Router } from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import {
  getMusicLevelsMap,
  getUserMusicProgress,
  createOrUpdateMusicProgress,
  initMusicLevel
} from "../controllers/MusicLogic/musicController.js";

const router = Router();

router.get("/music/levels-map/:userId", authenticateToken, getMusicLevelsMap);
router.get("/music/progress/:userId/:levelId", authenticateToken, getUserMusicProgress);
router.post("/music/progress", authenticateToken, createOrUpdateMusicProgress);
router.get("/music/init/:levelId", authenticateToken, initMusicLevel);

export default router;
