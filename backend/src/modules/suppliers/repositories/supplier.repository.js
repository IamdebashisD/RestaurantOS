import { Supplier } from "../models/supplier.model.js"

// 1. Create a new supplier
export async function createSupplier(supplierData, session) {
    return Supplier
        .create([supplierData], { session })
        .then(([supplier]) => supplier )
}

// 2. Find a supplier by its unique ID
export async function findSupplierById(supplierId, session) {
    const query = Supplier.findById(supplierId)
    if (session) query.session(session)
    return query.exec()
}

// 3. Find a supplier by name within a restaurant
export async function findSupplierByName(restaurantId, name, session) {
    const query = Supplier.findOne({ restaurant: restaurantId, name })
    if (session) query.session(session)
    return query.exec()
}

// 4. Get all suppliers for a restaurant
export async function findSuppliersByRestaurant(
    restaurantId, 
    filters = {}, 
    options = {}, 
    session
) {
    const query = { restaurant: restaurantId }
    if (filters.status) {
        query.status = filters.status
    }
    if (filters.search) {
        query.name = { 
            $regex: filters.search,
            $options: "i"
        }
    }

    const mongooseQuery = Supplier.find(query).sort({ name: 1 })

    if (options.skip !== undefined) mongooseQuery.skip(options.skip)
    if (options.limit !== undefined) mongooseQuery.limit(options.limit)
    if (session) mongooseQuery.session(session)
    
    return mongooseQuery.exec()
}

// 5. Count suppliers for a restaurant
export async function countSuppliersByRestaurant(restaurantId, filters = {}) {
    const query = { restaurant: restaurantId }
    if (filters.status) {
        query.status = filters.status
    }
    if (filters.search) {
        query.name = { 
            $regex: filters.search,
            $options: "i"
        }
    }
    return Supplier.countDocuments(query).exec()
}

// 6. Update a supplier by its unique ID
export async function updateSupplierById(supplierId, updateData, session) {
    const query = Supplier.findByIdAndUpdate(
        supplierId,
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
