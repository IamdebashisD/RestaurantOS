import { Invoice } from "../models/invoice.model.js";

// 1. Create Invoice
export async function createInvoice(invoiceData, session) {
    return Invoice.create([invoiceData], { session }).then(([invoice]) => invoice)
}

// 2. Find Invoice by ID
export async function findInvoiceById(invoiceId, session) {
    const query = Invoice
        .findById(invoiceId)
        .populate("customer", "name email")
        .populate("table", "tableNumber capacity")
        .populate("order")

    if (session) query.session(session)
    return query.exec() 
}

// 3. Find all Invoice for a Restaurant
export async function findInvoicesByRestaurant(restaurantId, session) {
    const query = Invoice
        .find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .populate("customer", "name email")
        .populate("table", "tableNumber capacity")

    if (session) query.session(session)
    return query.exec() 
}

// 4. Find Invoice by Order
export async function findInvoiceByOrder(orderId, session) {
    const query = Invoice
        .findOne({ order: orderId })
        .populate("customer", "name email")
        .populate("table", "tableNumber capacity")
        .populate("order")

    if (session) query.session(session)
    return query.exec()
}

// 5. Find Invoice by Invoice Number 
export async function findInvoiceByNumber(invoiceNumber, session) {
    const query = Invoice
        .findOne({ invoiceNumber })
        .populate("customer", "name email")
        .populate("table", "tableNumber capacity")
        .populate("order")

    if (session) query.session(session)
    return query.exec() 
}

// 6. Update Invoice by ID
export async function updateInvoiceById(invoiceId, updateData, session) {
    const query = Invoice.findByIdAndUpdate(
        invoiceId,
        { 
            $set: updateData
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    )

    if (session) query.session(session)
    return query.exec()
}