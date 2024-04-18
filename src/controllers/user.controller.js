import  { asyncHandler } from "../utils/asyncHandler.js"
import  { ApiError } from "../utils/ApiError.js"
import  { User } from "../models/user.model.js"
import  { uploadOnCloudinary } from "../utils/cloudinary.js"
import  { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId) =>
{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})
        
        return{ accessToken, refreshToken }

    } catch(error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    //---Build Register Controller----
    //--------STEPS-------------------
    //1> get user details from frontend
    //2> validation - not empty
    //3> check if user alredy exists
    //4> check for images, check for avatar
    //5> upload them to cloudinary, check upload or not avatar
    //6> create user object then create entry in db
    //7> remove password and refreh token field from response
    //8> check for user create or not
    //9> return response

    // 1>----
    const {fullName, email, username, password}= req.body
    console.log("email: ", email);
    // console.log("username: ", username);


    // 2>----
    if(
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    // 3>----
    const existedUser= await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);


    // 4>----
    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&          req.files.coverImage.length >0 ) {
        coverImageLocalPath= req.files.coverImage[0].path     
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // 5>---
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    // 6>----
    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // 7>----
    const createdUser= await User.findById(user._id).select(
        "-password -refrehToken"
    )

 
    //8>----
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    //9>----
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) =>{
    //1>-- take data from req.body
    //2>-- username or email -exist or not
    //3>-- find the user-(based on username or email)
    //4>-- if user exist password check
    //5>-- if password match, send access and  refresh token -user
    //6>-- send cookie

    //1>---
    const {email, username, password} = req.body
    console.log(email)
    

    //2>---
    if(!username && !email)
     {
        throw new ApiError(400, "username or email is required")
     }
    //here is alternative of above code based on logic discuss
    //if (!(username || email)){
    //     throw new ApiError(400, "username or email is required")
    // }


    //3>---
    const user = await User.findOne({
        $or: [{username}, {email}]
    }) 

    if(!user) {
        throw new ApiError(406, "user does not exist") 
    }


    //4>---
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
     throw new ApiError(401, "Invalid user credentials")
    }


    //5>---
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //password and refershToken field cancel
    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    //6>---
    //only server modifiable and client can't modify 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    )
})

//logged out code---
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set:  {
            //     refreshToken :undefined
            $unset: {
                   refreshToken: 1 // this removes the field from document
            }
        },
        {
        new: true
        }
    )

    const options = {
         httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refershAccessToken = asyncHandler(async (req, res) => 
{
    const incomingRefreshToken = req.cookies.refreshToken || 
    req.body.refreshToken

    if(!incomingRefreshToken)
     {
        throw new ApiError(401, "unauthorized request")
     }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
         {
            throw new ApiError(401, "Invalid refersh token")
         }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 
        "Invalid refersh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => 
{
  const {oldPassword, newPassword} = req.body

//-------if we need a confirmpassword field check
//   const {oldPassword, newPassword, confirmpassword} = req.body
//   if(!(newPassword === confirmpassword))
//   {
//     throw new ApiError(201, "password is not match check please")
//   }

  const user = await User.findById(req.user?._id) 
  const isPasswordCorrect= await user.
  isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }
  user.password= newPassword
  await user.save({validateBeforeSave: false})  

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser= asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user,"user fetched successfully"
    ))
})

const updateAccountDetails= asyncHandler(async(req, res) =>
 {
    const {fullName, email} = req.body

    if(!fullName || ! email)
     {
        throw new ApiError(400, "All fields are required")
     }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
 })

const updateUserAvater = asyncHandler(async(req, res) => 
 {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar  file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
     {
        throw new ApiError(400, "Error while uploading on avatar")
     }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password") 

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image updated successfully")
    )
 }) 

const updateUserCoverImage = asyncHandler(async(req, res) => 
 {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
     {
        throw new ApiError(400, "Error while uploading on CoverImage")
     }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password") 

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
 }) 

const getuserChannelProfile = asyncHandler(async(req, res) =>
 {
  const {username} = req.params

  if(!username?.trim())
   {
    throw  new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
    {
        $match: {
            username: username?.toLowerCase()
        }
    },
    {//Subscribers(how many subscriber subscribe your channel) pipeline
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {// subscribedTo(user did how many number of subscribed channel yourself) pipeline
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribeTo"
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelsSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond : {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
    }
   ])

   if(!channel.length)
    {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0], "User channel fetched successfully")
    )
 }) 

const getWatchHistory = asyncHandler(async(req, res) =>
  {
    const user= await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
        
                       },
                       { 
                        $addFields: {
                        owner: {
                              $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
   ])

   return res
   .status(200)
   .json(
        new ApiResponse(
        200, user[0].watchHistory, "watch history fetched successfully"
        ) 
   )
})

export{ registerUser,
      loginUser,
      logoutUser,
      refershAccessToken,
      changeCurrentPassword,
      getCurrentUser,
      updateAccountDetails, 
      updateUserAvater,
      updateUserCoverImage,
      getuserChannelProfile,
      getWatchHistory
       }