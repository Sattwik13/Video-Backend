import { Router } from "express";
import  { 
    addVideoToPlaylist,
    createPlaylist,
    deletePlayList,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewear.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middlewear to all routes  in this file

router.route("/").post(createPlaylist)

router.route("/:playlistId")
      .get(getPlaylistById)
      .patch(updatePlaylist)
      .delete(deletePlayList);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router