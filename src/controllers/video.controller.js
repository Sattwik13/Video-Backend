import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

const getAllVideos = asyncHandler(async(req, res) => {
    const { page=1, limit= 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishVideo = asyncHandler(async(req, res) => {
    const {title, description} = req.body
    //TODO: get video, upload to cloudinary, create video
})

const getVideoById= asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail 
})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params
})

export{
     getAllVideos,
     publishVideo,
     getVideoById,
     updateVideo,
     deleteVideo,
     togglePublishStatus
}