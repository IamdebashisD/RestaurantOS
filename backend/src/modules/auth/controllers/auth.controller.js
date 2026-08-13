import * as authService from "../services/auth.service.js"
import ApiResponse from '../../../utils/api-response.js'
import { catchAsync } from "../../../utils/catchAsync.js"

export const signupController = catchAsync(async (req, res, next) => {
    const registeredUser = await authService.signupService(req.body)

    return ApiResponse.created(res, {
        message: "Account created successfully",
        data: registeredUser
    })

})

export const signinController = catchAsync(async (req, res, next) => {
    const result = await authService.signinService(req.body)

    return ApiResponse.success(res, {
        message: "Login successful",
        data: result
    })
})
