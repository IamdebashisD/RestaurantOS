import mongoose from "mongoose"

import {
    createMenuCategory,
    findMenuCategoryByRestaurantAndName,
    findMenuCategoriesByRestaurant,
    findMenuCategoryById,
    updateMenuCategoryById,
} from "../repositories/menu-category.repository.js"

import { findRestaurantById } from "../../restaurants/repositories/restaurant.repository.js"

import ApiError from "../../../utils/api-error.js"

// Create Categories Service
export async function createMenuCategoryService({
    restaurantId,
    name,
    description,
    displayOrder,
    isActive
}) {
    // Check restaurant exists
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")

    const session = await mongoose.startSession()
    try {
        let category

        await session.withTransaction(async () => {
            // Check duplicate category
            const existingCategory = await findMenuCategoryByRestaurantAndName(restaurantId, name, session)
            if (existingCategory) {
                throw ApiError.conflict(`Category "${name}" already exists in this restaurant`)
            }
            
            const categoryData = {
                restaurant: restaurantId,
                name,
                description,
                displayOrder,
                isActive
            }
            const result = await createMenuCategory(categoryData, session)
            category = Array.isArray(result) ? result : result
        })

        return category
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw ApiError.internal("Failed to create menu category due to a database error", error)
    } finally {
        await session.endSession()
    }
}

// Get All Categories Service
export async function getRestaurantMenuCategoriesService(restaurantId) {
    const restaurant = await findRestaurantById(restaurantId)
    if (!restaurant) throw ApiError.notFound("Restaurant not found")
        
    const categories = await findMenuCategoriesByRestaurant(restaurantId)
    return categories
}

// Get Single Category Service
export async function getMenuCategoryService({ restaurantId, categoryId }) {
    const category = await findMenuCategoryById(categoryId)
    if (!category) throw ApiError.notFound("Menu category not found")
    if (category.restaurant._id.toString() !== restaurantId) throw ApiError.notFound("Menu category not found")
    return category
}

// Update Category Service
export async function updateMenuCategoryService({
    restaurantId,
    categoryId,
    name,
    description,
    displayOrder,
    isActive
}) {
    const existingCategory = await findMenuCategoryById(categoryId)
    if (!existingCategory) throw ApiError.notFound("Menu category not found")
    if (existingCategory.restaurant._id.toString() !== restaurantId) throw ApiError.notFound("Menu category not found")
    
    if (name !== undefined && name !== existingCategory.name) {
        const duplicateCategory = await findMenuCategoryByRestaurantAndName(restaurantId, name)
        if (duplicateCategory) throw ApiError.conflict(`Category "${name}" already exists in this restaurant`)
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder
    if (isActive !== undefined) updateData.isActive = isActive

    if (Object.keys(updateData).length === 0) return existingCategory

    const updateCategory = await updateMenuCategoryById(categoryId, updateData)
    return updateCategory
}

// Soft Delete Category
export async function deleteMenuCategoryService({ restaurantId, categoryId }) {
    const existingCategory = await findMenuCategoryById(categoryId)
    if (!existingCategory) throw ApiError.notFound("Menu category not found")
    if (existingCategory.restaurant._id.toString() !== restaurantId) throw ApiError.notFound("Menu category not found")
    
    if (!existingCategory.isActive) throw ApiError.notFound("Menu category not found")
    
    const deleteCategory = await updateMenuCategoryById(categoryId, { isActive: false })
    return deleteCategory
}