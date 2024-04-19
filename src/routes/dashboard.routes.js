import { Router } from "express";
import {
    getchannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewear.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getchannelStats);
router.route("/videos").get(getChannelVideos);

export default router