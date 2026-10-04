import ApiResponse from "../../../utils/api-response.js"
import { catchAsync } from "../../../utils/catchAsync.js"
import * as ReportService from "../services/report.service.js"


/**
 * Express controller to handle HTTP requests for compiling all-in-one restaurant analytical summaries
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getDashboardSummaryController = catchAsync(async (req, res) => {
    const { restaurantId } = req.params
    const { startDate, endDate } = req.query

    const dashboardData = await ReportService
        .getDashboardSummaryService({ 
            restaurantId, 
            startDate, 
            endDate 
        })

    return ApiResponse.success(res, {
        message: "All-in-one business dashboard report compiled successfully",
        data: {
            dashboardData
        }
    })
})
