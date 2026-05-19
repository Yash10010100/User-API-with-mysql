import multer, { diskStorage, MulterError } from "multer";
import { generateRandomHex } from "../utils/randomHexString.js";
import { ApiError } from "../utils/ApiError.js";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const uploadDir = resolve('./public/uploads')
if (!existsSync(uploadDir)) mkdirSync(uploadDir)

const storage = diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, `${generateRandomHex()}.jpeg`)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024       // 2 MB
    },
    fileFilter: function (req, file, cb) {
        const allowedMimetypes = ["image/png", "image/jpeg"]
        if (allowedMimetypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new ApiError(400, `${file.mimetype?.split("/")?.[1]} files not allowed, only ${allowedMimetypes.map(m => m.slice(6)).join(" / ")} files are allowed`), false)
        }
    }
})

const uploadAvatar = (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
        if (err) {
            console.error(err);

            if (err instanceof ApiError) {
                next(err)
            }
            else if (err instanceof MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    next(new ApiError(400, `${err.field} file is too large, maximum 2MB is allowed`))
                } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                    next(new ApiError(400, `Unexpected file named ${err.field}`))
                } else {
                    next(new ApiError(500, `Failed to upload ${err.field}, please try again`))
                }
            } else {
                next(new ApiError(500, `Failed to upload avatar file, please try again`))
            }
        } else {
            next()
        }
    })
}

export {
    upload,
    uploadAvatar
}