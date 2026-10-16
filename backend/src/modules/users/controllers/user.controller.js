import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"
import * as UserService from "../services/user.service.js"

export const getProfileController = catchAsync(async (req, res, next) => {
    const userProfile = await UserService.getUserProfileService({ userId: req.user.id })
    return ApiResponse.success(res, {
        message: "User profile retrieved successfully",
        data: {
            user: userProfile 
        }
    })
})