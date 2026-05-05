import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"

class User {
    constructor(email, username, password, firstname, lastname, avatar) {
        this.email = email
        this.username = username
        this.password = password
        this.firstname = firstname
        this.lastname = lastname
        this.avatar = avatar
    }
}

const createUserObject = async ({ email, username, password, firstname, lastname, avatar }) => {
    const hashedPassword = await hashPassword(password)

    return new User(email, username, hashedPassword, firstname, lastname, avatar)
}

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
}

const isPasswordCorrect = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
}

const generateAccessTokens = (id) => {
    return jwt.sign({ uid: id, email: null }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY) })
}

const generateRefreshTokens = (id) => {
    return jwt.sign({ uid: id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}

const decodeJWT = (token, secret) => {
    try {
        return jwt.verify(token, secret)
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, "Expired or invalid token!")
        } else {
            throw error
        }
    }
}

export { createUserObject, hashPassword, isPasswordCorrect, generateAccessTokens, generateRefreshTokens, decodeJWT }