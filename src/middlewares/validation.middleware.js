import { ApiError } from "../utils/ApiError.js";

const validateInput = (target) => {
    return (req, res, next) => {
        if (!req.body) {
            throw new ApiError(400, "Request body is required!")
        }

        const { email, username, password, firstname, lastname, newPassword, emailOrUsername } = req.body

        const avatar = req.file?.filename
        if (avatar) {
            req.body.avatar = avatar
        }

        if (target === "REGISTER") {
            if (!req.body.avatar) {
                throw new ApiError(400, "Avatar image is required!")
            }
            isValidEmail(email, true)
            isValidUsername(username, true)
            isValidPassword(password, true)
            isValidName(firstname, true)
            isValidName(lastname, true)
        } else if (target === "LOGIN") {
            isValidEmailOrUsername(emailOrUsername, true)
            isValidPassword(password, true)
        } else if (target === "UPDATE") {
            if (email) isValidEmail(email, false)
            if (username) isValidUsername(username, false)
            if (firstname) isValidName(firstname, false)
            if (lastname) isValidName(lastname, false)
        } else if (target === "PASSWORD") {
            isValidPassword(password, true)
            isValidPassword(newPassword, true)
        }

        next()
    }
}

const isValidName = (name, required) => {
    if (required && !name?.trim()) {
        throw new ApiError(400, "Firstname and lastname are required")
    }
    else if (!/^[a-zA-Z]+$/.test(name)) {
        throw new ApiError(400, "Firstname and lastname should only contain alphabets!")
    }
}

const isValidEmail = (email, required) => {
    if (required && !email?.trim()) {
        throw new ApiError(400, "Email is required")
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        throw new ApiError(400, "Email is invalid!")
    }
}

const isValidUsername = (username, required) => {
    if (required && !username?.trim()) {
        throw new ApiError(400, "Username is required")
    }
    else if (!/^[A-Za-z0-9_@]*$/.test(username)) {
        throw new ApiError(400, "Username is invalid, should only contain alphabets, numbers, '_' and '@'")
    }
}

const isValidPassword = (password, required) => {
    if (required && !password?.trim()) {
        throw new ApiError(400, "Password is required")
    }
    else if (!/^[A-Za-z0-9_@#&-]*$/.test(password) || password.length < 8) {
        throw new ApiError(400, "Password is invalid, should be at least 8 characters long and can contain special characters like @,_,#,&,-")
    }
}

const isValidEmailOrUsername = (value, required) => {
    if (required && !value?.trim()) {
        throw new ApiError(400, "Email or Username is required")
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) && !/^[A-Za-z0-9_@]*$/.test(value)) {
        throw new ApiError(400, "Provide value is not a valid email or username")
    }
}

export {
    validateInput
}