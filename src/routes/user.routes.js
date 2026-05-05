import { Router } from "express";
import {
    createUser,
    deleteUser,
    getAllUsers,
    getAvatarImage,
    getProfilePreview,
    getUser,
    login,
    logout,
    refreshAccessToken,
    searchUsers,
    updatePassword,
    updateUser
} from "../controllers/user.controller.js";
import { validateInput } from "../middlewares/validation.middleware.js";
import { upload, uploadAvatar } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register")
    .post(uploadAvatar, validateInput("REGISTER"), createUser)

userRouter.route("/login")
    .post(upload.none(), validateInput("LOGIN"), login)

userRouter.route("/logout")
    .post(verifyJWT, logout)

userRouter.route("/refresh")
    .get(refreshAccessToken)

userRouter.route("/")
    .get(getAllUsers)

userRouter.route("/search")
    .get(searchUsers)

userRouter.route("/u/:id/p")
    .put(verifyJWT, upload.none(), validateInput("PASSWORD"), updatePassword)

userRouter.route("/u/:id")
    .get(getUser)
    .put(verifyJWT, uploadAvatar, validateInput("UPDATE"), updateUser)
    .delete(verifyJWT, deleteUser)

userRouter.route("/u/:id/profile")
    .get(getProfilePreview)

userRouter.route("/a/:fileName")
    .get(getAvatarImage)

export { userRouter }