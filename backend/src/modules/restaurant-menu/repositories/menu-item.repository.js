import { MenuItem } from "../models/menu-item.model.js";

export async function createMenuItem(itemData, session) {
    return MenuItem.create([itemData], { session }).then(([item]) => item)
}

export async function findMenuItemById(itemId, session) {
    const query = MenuItem.findById(itemId).populate("category", "name description displayOrder")
    if (session) query.session(session)
    return query
}

export async function findMenuItemsByRestaurant(restaurantId, session) {
    const query = MenuItem
        .find({ restaurant: restaurantId })
        .populate("category", "name description displayOrder")
        .sort({ category: 1, name: 1})

    if (session) query.session(session)
    return query
}

export async function updateMenuItemById(itemId, updateData, session) {
    const query = MenuItem.findByIdAndUpdate(itemId, { $set: updateData }, { returnDocument: "after", runValidators: true })
    if (session) query.session(session)
    return query
}

