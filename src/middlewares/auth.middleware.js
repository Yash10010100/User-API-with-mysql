import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { query } from "../db/index.js"
import { decodeJWT } from "../models/User.js"

const verifyJWT = async (req, res, next) => {
    const authorization = req.headers.authorization

    const token = req.cookies?.accessToken || authorization?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Token required!")
    }

    const decoded = decodeJWT(token, process.env.ACCESS_TOKEN_SECRET)

    if (!decoded) {
        throw new ApiError(401, "Unauthorized!")
    }

    const [[user], fields] = await query(
        "SELECT * FROM users WHERE uid = ?",
        decoded?.uid
    )

    if (!user) {
        throw new ApiError(401, "User not found!")
    }

    if (!user.refreshToken) {
        throw new ApiError(401, "Unauthorized!")
    }

    req.user = user

    next()
}

export {
    verifyJWT
}