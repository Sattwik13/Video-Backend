import { Router } from "express";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewear.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middlewear to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router