import { resolve } from "path"
import { query } from "../db/index.js"
import { createUserObject, decodeJWT, generateAccessTokens, generateRefreshTokens, hashPassword, isPasswordCorrect } from "../models/User.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { deleteFile } from "../utils/delateFile.js"
import { existsSync } from "fs"

const generateTokens = async (id) => {
    const accessToken = generateAccessTokens(id)
    const refreshToken = generateRefreshTokens(id)

    await query(
        "UPDATE users SET refreshToken = ? WHERE uid = ?;",
        [refreshToken, id]
    )

    return { accessToken, refreshToken }
}

const createUser = async (req, res) => {
    const { email, username, password, firstname, lastname, avatar } = req.body

    const user = await createUserObject(req.body)

    try {
        const [result1, fields1] = await query(
            "SELECT * FROM users WHERE email = ? OR username = ?;",
            [email, username]
        )

        if (result1[0]) {
            if (result1[0].email === email) {
                throw new ApiError(409, "User with same email already exists!")
            } else {
                throw new ApiError(409, "User with same username already exists!")
            }
        }

        const [result, fields] = await query(
            "INSERT INTO users(email, username, password, firstname, lastname, avatar) VALUES (?);",
            [Object.values(user)]
        )

        res
            .status(201)
            .json(req.body, new ApiResponse(201, "User created"))
    } catch (error) {
        await deleteFile(avatar)
        throw error
    }
}

const login = async (req, res) => {
    const { email, username, password } = req.body

    const [[user], fields] = await query(
        email ?
            `SELECT * 
            FROM users 
            WHERE email = ?;`
            :
            `SELECT *
            FROM users
            WHERE username = ?;`,
        email || username
    )

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    if (!isPasswordCorrect(password, user.password)) {
        throw new ApiError(400, "Incorrect password!")
    }

    const { accessToken, refreshToken } = await generateTokens(user.uid)

    delete user.password
    delete user.refreshToken

    res
        .status(200)
        .json(req.body, new ApiResponse(200, "Login successful", { user, accessToken, refreshToken }))
}

const refreshAccessToken = async (req, res) => {
    const authorization = req.headers?.authorization

    const token = authorization?.replace("Bearer ", "")

    const decoded = decodeJWT(token, process.env.REFRESH_TOKEN_SECRET)

    if (!decoded) {
        throw new ApiError(400, "Invalid token!")
    }

    const [[user], fields] = await query(
        "SELECT * FROM users WHERE uid = ?;",
        decoded.uid
    )

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    if (user?.refreshToken !== token) {
        throw new ApiError(400, "Provided refresh token is outdated!")
    }

    const { accessToken, refreshToken } = await generateTokens(user?.uid)

    res
        .status(200)
        .json(null, new ApiResponse(200, "Tokens refreshed", { accessToken, refreshToken }))
}

const logout = async (req, res) => {
    const [result, fields] = await query(
        "UPDATE users SET refreshToken = NULL WHERE uid = ?",
        req.user.uid
    )

    res
        .status(200)
        .json(null, new ApiResponse(204, "User logged out"))
}

const getUser = async (req, res) => {
    const { id } = req.params

    const [[user], fields] = await query(
        `SELECT
            uid, email, username, firstname, lastname, avatar, createdAt, updatedAt
        FROM users
        WHERE uid = ?;`,
        id
    )

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    res
        .status(200)
        .json(null, new ApiResponse(200, "User found", user))
}

const getAllUsers = async (req, res) => {
    const { limit = 25, page = 1 } = req.query

    let l = Number(limit) || 25, p = Number(page) || 1

    if (l < 0) l = 25
    if (p <= 0) p = 1

    let offset = (p - 1) * l

    const [result, fields] = await query(
        "SELECT uid, email, username, firstname, lastname, avatar, createdAt, updatedAt FROM users ORDER BY uid DESC LIMIT ? OFFSET ?;",
        [l, offset]
    )

    res
        .status(200)
        .json(null, new ApiResponse(200, "List of users", result))
}

const searchUsers = async (req, res) => {
    const { key = "", limit, page } = req.query

    const l = Number(limit) || 10, p = Number(page) || 1, offset = (p - 1) * l

    try {
        const [[result, [{totalUsers}]], fields] = await query(
            `CALL search_users_by_key(?, ?, ?);`,
            [key, l, offset]
        )

        res
            .status(200)
            .json(null, new ApiResponse(200, `Showing ${result.length?offset+1:0} - ${result.length?offset+result.length:0} / ${totalUsers} matched records`, result))
    } catch (error) {
        throw new Error(error.message)
    }
}

const updatePassword = async (req, res) => {
    const { id } = req.params
    const { password, newPassword } = req.body

    if (Number(id) !== req.user?.uid) {
        throw new ApiError(403, "Not enough permission to update other user's password!")
    }

    if (password === newPassword) {
        throw new ApiError(400, "New password cannot be same as old password")
    }

    if (!await isPasswordCorrect(password, req.user?.password)) {
        throw new ApiError(400, "Wrong password")
    }

    const hashedPassword = await hashPassword(newPassword)

    const [result, fields] = await query(
        "UPDATE users SET password = ? WHERE uid = ?;",
        [hashedPassword, id]
    )

    res
        .status(200)
        .json(req.body, new ApiResponse(200, "Password updated"))
}

const updateUser = async (req, res) => {
    const { id } = req.params
    const { email, username, firstname, lastname, avatar } = req.body

    if (Number(id) !== req.user?.uid) {
        throw new ApiError(403, "Not enough permission to update other users!")
    }

    if (email) {
        const [[user], fields] = await query(
            "SELECT uid, email FROM users WHERE email = ? AND uid != ?;",
            [email, id]
        )

        if (user) {
            throw new ApiError(403, "User with same email already exists!")
        }
    }

    if (username) {
        const [[user], fields] = await query(
            "SELECT uid, username FROM users WHERE username = ? AND uid != ?;",
            [username, id]
        )

        if (user) {
            throw new ApiError(403, "User with same username already exists!")
        }
    }

    const updates = {}

    if (email) updates.email = email
    if (username) updates.username = username
    if (firstname) updates.firstname = firstname
    if (lastname) updates.lastname = lastname
    if (avatar) updates.avatar = avatar

    const [result, fields] = await query(
        "UPDATE users SET ? WHERE uid = ?;",
        [updates, id]
    )

    if (avatar) {
        await deleteFile(req.user?.avatar)
    }

    res
        .status(200)
        .json(req.body, new ApiResponse(200, "User details updated"))
}

const deleteUser = async (req, res) => {
    const { id } = req.params

    if (Number(id) !== req.user?.uid) {
        throw new ApiError(403, "Not enough permission to delete other users!")
    }

    const [result, fields] = await query(
        "DELETE FROM users WHERE uid = ?;",
        id
    )

    await deleteFile(r[0].avatar)

    res
        .status(200)
        .json(null, new ApiResponse(204, "User deleted"))
}

const getAvatarImage = async (req, res) => {
    const { fileName } = req.params

    const filePath = resolve("./public/uploads", fileName)

    if (!existsSync(filePath)) {
        throw new ApiError(404, "File does not exist!")
    }

    res
        .status(200)
        // .json(null, new ApiResponse(200, `File : { Path : ${filePath} }`), false, res.sendFile, filePath)
        .sendFile(filePath)

    res
        .json(null, new ApiResponse(200, `File : { Path : ${filePath} }`), false)
}

const getProfilePreview = async (req, res) => {
    const { id } = req.params

    const [[user], fields] = await query(
        "SELECT * FROM users WHERE uid = ?;",
        id
    )

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    const template = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User profile preview</title>
                <style>
                    tr {
                        padding: 4px 16px;
                        display: flex;
                        justify-content: space-around;
                        gap: 8px;
                    }
                    td {
                        width: 70%;
                        text-align: center;
                    }
                    td:first-child {
                        width: 30%;
                        color: mediumseagreen;
                    }
                    .card {
                        text-align: center;
                        padding : 30px;
                        display : flex;
                        flex-direction: column;
                        gap: 16px;
                        justify-content: center;
                        align-items: center;
                        border-radius : 20px;
                        border : 2px solid rgba(255, 255, 255, 0.4)
                    }
                </style>
            </head>
            <body style="height: 100vh; width: 100%; display: flex; justify-content: center; align-items: center; background: rgb(35, 38, 42); color: aliceblue; padding-top: 8px">
                <div class="card">
                    <h1 style="color: cornflowerblue">${user.firstname} ${user.lastname}</h1>
                    <img src="http://localhost:${process.env.SERVER_PORT}/api/v1/users/a/${user.avatar}" alt="avatar preview" width=200>
                    <table style="border: 4px ridge rgba(255, 255, 255, 0.5); border-radius: 8px; font-size:1.3rem; padding: 4px;">
                        <tr>
                            <td>User id</td>
                            <td>${user.uid}</td>
                        </tr>
                        <tr>
                            <td>Email</td>
                            <td>${user.email}</td>
                        </tr>
                        <tr>
                            <td>Username</td>
                            <td>${user.username}</td>
                        </tr>
                    </table>
                </div>
            </body>
        </html>
    `

    res
        .status(200)
        .send(template)

    res
        .json(null, new ApiResponse(200, "Profile template sent"), false)
}

export {
    createUser,
    login,
    refreshAccessToken,
    logout,
    getUser,
    getAllUsers,
    updatePassword,
    updateUser,
    deleteUser,
    getAvatarImage,
    getProfilePreview,
    searchUsers
}