import { User } from '../models/user.model.js'

export async function findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim()
    return User.findOne({ email: cleanEmail })
}

export async function findUserByEmailWithPassword(email) {
    const cleanEmail = email.toLowerCase().trim()
    return User.findOne({ email: cleanEmail }).select("+password")
} 

export async function createUser(userData) {
    return User.create(userData)
}

export async function findUserById(userId) {
    return User.findById(userId)
}

