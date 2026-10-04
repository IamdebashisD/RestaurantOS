import mongoose from "mongoose"
import { Invoice } from "../../invoices/models/invoice.model.js"
import { Payment } from "../../payments/models/payment.model.js" 
import { PurchaseOrder } from "../../purchasing/models/purchase-order.model.js"
import { Inventory } from "../../inventory/models/inventory.model.js"


/**
 * Aggregates sales matrices from issued invoices within a date window boundary
 * @param {string} restaurantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Object>} Mapped sales revenue metrics fields object
 */
export async function getSalesSummary(restaurantId, startDate, endDate) {
    return Invoice.aggregate([
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                issuedAt: { $gte: startDate, $lt: endDate},
                status: { $ne: "CANCELLED"}
            }
        },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalSubtotal: { $sum: "$subtotal" },
                totalDiscount: { $sum: "$discount" },
                totalTax: { $sum: "$tax" },
                totalServiceCharge: { $sum: "$serviceCharge" },
                totalSales: { $sum: "$totalAmount" }
            }
        },

        {
            $project: {
                _id: 0,
                totalInvoices: 1,
                totalSubtotal: 1,
                totalDiscount: 1,
                totalTax: 1,
                totalServiceCharge: 1,
                totalSales: 1
            }
        }

    ]).exec() 
}

/**
 * Aggregates payment statistics broken down by settlement method matrices
 * @param {string} restaurantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array<Object>>} Method breakdowns array list
 */
export async function getPaymentMethodSummary(restaurantId, startDate, endDate) {
    return Payment.aggregate([
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                status: "COMPLETED",
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: "$method",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" }
            }
        },
        {
            $project: {
                _id: 0,
                method: "$_id",
                count: 1,
                totalAmount: 1
            }
        },
        {
            $sort: {
                method: 1
            }
        }
    ]).exec()
}

/**
 * Aggregates outbound purchasing investments across active vendor scopes
 * @param {string} restaurantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Object>} Outbound supply cost metrics
 */
export async function getPurchaseOrderSpendSummary( restaurantId, startDate, endDate) {
    return PurchaseOrder.aggregate([
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                status: { $in: ["ORDERED", "PARTIALLY_RECEIVED", "RECEIVED"]},
                orderedAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalSpend: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 }
            }
        }
    ]).exec()
}

/**
 * Resolves a snapshot evaluation calculation of active physical warehouse assets
 * @param {string} restaurantId 
 * @returns {Promise<Object>} Raw asset cost metrics
 */
export async function getInventoryValuationSummary(restaurantId) {
    return Inventory.aggregate([
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                status: "ACTIVE"
            }
        },
        {
            $project: {
                itemValue: { 
                    $multiply: [ 
                        { $ifNull: ["$currentQuantity", 0] }, 
                        { $ifNull: ["$costPerUnit", 0] } 
                    ] 
                }
            }
        },
        {
            $group: {
                _id: null,
                totalValue: { $sum: "$itemValue" },
                totalItemsTracked: { $sum: 1 }
            }
        }
    ]).exec()    
}
