import ApiError from "../../../utils/api-error.js"
import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import {
    getSalesSummary,
    getPaymentMethodSummary,
    getPurchaseOrderSpendSummary,
    getInventoryValuationSummary,
} from "../repositories/report.repository.js"



/**
 * Compiles a comprehensive dashboard report by combining sales, payments, purchases, and inventory valuation
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} [params.startDate] - Bounded ISO date string (e.g., "2026-09-01")
 * @param {string} [params.endDate] - Bounded ISO date string (e.g., "2026-09-30")
 * @returns {Promise<Object>} The consolidated business analytics dataset payload
 */
export async function getDashboardSummaryService({ restaurantId, startDate, endDate }) {
    // 1. Enforce multi-tenant restaurant boundary verification
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    // 2. Compute date boundaries with safe historical fallbacks (defaulting to the last 30 days)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate 
        ? new Date(startDate) 
        : new Date(new Date().setDate(end.getDate() - 30))

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw ApiError.badRequest("Invalid date range formats provided")
    }
    if (start > end) throw ApiError.badRequest("Start date cannot be after the selected end date")
    
    // 3. Execute all aggregation pipelines concurrently in parallel thread workers
    const [
        salesRawArray, 
        paymentsRaw, 
        purchasingRawArray, 
        inventoryRawArray
    ] = await Promise.all([
        getSalesSummary(restaurantId, start, end),
        getPaymentMethodSummary(restaurantId, start, end),
        getPurchaseOrderSpendSummary(restaurantId, start, end),
        getInventoryValuationSummary(restaurantId)
    ])

    // FIXED: Unbox index 0 here AFTER Promise.all has completely resolved the data!
    const salesRaw = salesRawArray[0] || {
        totalInvoices: 0,
        totalSubtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        totalServiceCharge: 0,
        totalSales: 0
    }

    const purchasingRaw = purchasingRawArray[0] || { totalSpend: 0, totalOrders: 0 }
    const inventoryRaw = inventoryRawArray[0] || { totalValue: 0, totalItemsTracked: 0 }

    // 4. Sanitize floating point math calculations to prevent decimal point anomalies
    const sales = {
        totalInvoice: salesRaw.totalInvoices,
        subtotal: Math.round(salesRaw.totalSubtotal * 100) / 100,
        discount: Math.round(salesRaw.totalDiscount * 100) / 100,
        tax: Math.round(salesRaw.totalTax * 100) / 100,
        serviceCharge: Math.round(salesRaw.totalServiceCharge * 100) / 100,
        netRevenue: Math.round(salesRaw.totalSales * 100) / 100  
    }

    const payments = paymentsRaw.map((pay) => ({
        method: pay.method,
        count: pay.count,
        totalAmount: Math.round(pay.totalAmount * 100) / 100
    }))

    const purchasing = {
        totalOrdersPlaced: purchasingRaw.totalOrders,
        totalSpend: Math.round(purchasingRaw.totalSpend * 100) / 100
    }
    
    const inventory = {
        activeSkuCount: inventoryRaw.totalItemsTracked,
        currentStockValue: Math.round(inventoryRaw.totalValue * 100) / 100
    }

    // 5. Derive actionable high-level business diagnostics insight scores
    const netProfitMarginSummary = Math.round((sales.netRevenue - purchasing.totalSpend) * 100) / 100

    return {
        timeframe: {
            from: start.toISOString(),
            to: end.toISOString()
        },
        salesOverview: sales,
        paymentMethodsBreakdown: payments,
        procurementSpend: purchasing,
        assetValuation: inventory,
        diagnostics: {
            netOperationalBalance: netProfitMarginSummary
        }
    }
}
