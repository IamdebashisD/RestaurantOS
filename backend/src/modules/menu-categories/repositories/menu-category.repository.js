import { MenuCategory } from "../models/menu-category.model.js";

// Create category
export async function createMenuCategory(categoryData, session) {
    const [category] = await MenuCategory.create([categoryData], { session })
    return category
}

// Find category by ID
export async function findMenuCategoryById(categoryId, session) {
    const query = MenuCategory.findById(categoryId).populate("restaurant", "name slug")
    if (session) query.session(session)
    return query
}

// Find all categories for a restaurant
export async function findMenuCategoriesByRestaurant(restaurantId, session) {
    const query = MenuCategory.find({ restaurant: restaurantId }).sort({ displayOrder: 1, name: 1 })
    if (session) query.session(session)
    return query
}

// Find categories by restaurant and name
export async function findMenuCategoryByRestaurantAndName(restaurantId, name, session) {
    const query = MenuCategory.findOne({ restaurant: restaurantId, name })
    if (session) query.session(session)
    return query
}

// Update category
export async function updateMenuCategoryById(categoryId, updateData, session) {
    const query = MenuCategory.findByIdAndUpdate(
        categoryId,
        updateData,
        {
            returnDocument: "after",
            runValidators: true
        }
    ).populate("restaurant", "name slug")

    if (session) query.session(session)

    return query
}