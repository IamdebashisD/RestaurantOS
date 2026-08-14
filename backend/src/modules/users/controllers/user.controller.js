import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"

export const getProfileController = catchAsync(async (req, res, next) => {
    return ApiResponse.success(res, {
        message: "User profile retrieved successfully",
        data: {
            user: req.user
        }
    })
})