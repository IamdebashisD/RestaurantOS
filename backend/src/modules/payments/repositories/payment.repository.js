import { Payment } from "../models/payment.model.js"

// Create Payment Entry
export async function createPayment(paymentData, session) {
    return Payment
        .create([paymentData], { session })
        .then(([payment]) => payment)
}

// 2. Find Payment by ID
export async function findPaymentById(paymentId, session) {
    const query = Payment
        .findById(paymentId)
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")
    
    if (session) query.session(session)

    return query.exec()
}

// 3. Find all Payments for a Restaurant
export async function findPaymentsByRestaurant({ restaurantId, options={}, session }) {
    const query = Payment
        .find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")

    if (options.skip !== undefined) query.skip(options.skip)
    if (options.limit !== undefined) query.limit(options.limit)

    if (session) query.session(session)

    return query.exec()
}

// 4. Find Payments By Invoice
export async function findPaymentsByInvoice(invoiceId, session) {
    const query = Payment
        .find({ invoice: invoiceId })
        .sort({ createdAt: -1 })
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")

    if (session) query.session(session)

    return query.exec()
}

// 5. Find Payments by Order
export async function findPaymentsByOrder(orderId, session) {
    const query = Payment
        .find({ order: orderId })
        .sort({ createdAt: -1 })
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")

    if (session) query.session(session)

    return query.exec()
}

// 6. Find Payment by Payment Number
export async function findPaymentByNumber(paymentNumber, session) {
    const query = Payment
        .findOne({ paymentNumber })
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")

    if (session) query.session(session)

    return query.exec()
}

// 7. Find Payment by Transaction ID (Idempotency Lookup)
export async function findPaymentByTransactionId(transactionId, session) {
    const query = Payment
        .findOne({ transactionId })
        .populate("invoice")
        .populate("order")
        .populate("customer", "name email")

    if (session) query.session(session)

    return query.exec()
}

// 8. Update Payment by ID
export async function updatePaymentById(paymentId, updateData, session) {
    const query = Payment.findByIdAndUpdate(
        paymentId,
        { $set: updateData },
        {
            returnDocument: "after",
            runValidators: true
        }
    )

    if (session) query.session(session)

    return query.exec()
}

export async function countPaymentsByRestaurant(restaurantId) {
    return Payment.countDocuments({ restaurant: restaurantId }).exec()
}
