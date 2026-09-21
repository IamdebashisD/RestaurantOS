import { InventoryTransaction } from "../models/inventory-transaction.model.js"

// 1. Create a new inventory transaction
export async function createInventoryTransaction(transactionData, session) {
    return InventoryTransaction
        .create([transactionData], { session })
        .then(([transaction]) => transaction)
}
// 2. Find transactions for a specific inventory item
export async function findInventoryTransactions(inventoryId, options = {}, session) {
    const query = InventoryTransaction
        .find({ inventory: inventoryId })
        .populate({ path: "performedBy", select: "name email" })
        .sort({ createdAt: -1 })

    if (options.skip !== undefined) query.skip(options.skip)
    if (options.limit !== undefined) query.limit(options.limit)
    if (session) query.session(session)
        
    return query.exec()
}
// 3. Count transactions for a specific inventory item
export async function countInventoryTransactions(inventoryId) {
    return InventoryTransaction.countDocuments({ inventory: inventoryId }).exec()
}
// 4. Find a specific ledger transaction record by its unique ID
export async function findInventoryTransactionById(transactionId, session) {
    const query = InventoryTransaction.findById(transactionId)
        .populate("performedBy", "name email")
        .populate("inventory", "name unit")

    if (session) query.session(session)
    return query.exec()
}

