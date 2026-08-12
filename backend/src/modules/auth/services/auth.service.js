import ApiError from '../../../utils/api-error.js'
import { signToken } from '../../../utils/token.js'
import { 
    createUser, 
    findUserByEmail, 
    findUserById,
    findUserByEmailWithPassword,  
} from '../../users/repositories/user.repositories.js'


function toPublishUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    }
}

export async function signupService({ name, email, password }) {
    const existingUser = await findUserByEmail(email)
    if (existingUser) throw ApiError.conflict("An account with this email already exists")

    const user = await createUser({ name, email, password })

    const token = signToken({ id: user._id })
    return { user: toPublishUser(user), token }
}

export async function signinService({ email, password }) {
    const user = await findUserByEmailWithPassword(email)

    if (!user) throw ApiError.unauthorized("Invalid email or password")
    if (!user.isActive) throw ApiError.unauthorized("Account is inactive")

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) throw ApiError.unauthorized("Invalid email or password")

    user.lastLoginAt = new Date()
    await user.save({ validateModifiedOnly: true })

    const token = signToken({ id: user._id })
    return { user: toPublishUser(user), token }
}

// export async function getProfileService(userId) {
//     const user = await findUserById(userId)
//     if (!user) throw ApiError.notFound("User not found")

//     return { user: toPublishUser(user) }
// }