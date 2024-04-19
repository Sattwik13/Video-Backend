import  Mongoose, { isValidObjectId }  from "mongoose";
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    //TODO: get all liked videos
})

const getLikedVideos = asyncHandler(async(req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}