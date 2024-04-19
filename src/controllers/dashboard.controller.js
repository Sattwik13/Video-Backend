import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { Subscription } from "../models/subscription.model"
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getChannelStats = asyncHandler(async(req, res) => {
    //TODO: get a channel stats like total video views, total subscribers,
    // total videos, total likes etc
})

const getChannelVideos = asyncHandler(async(req, res) => {
    //TODO: get all the videos uploaded by the channel
})

export {
    getChannelStats,
    getChannelVideos
}