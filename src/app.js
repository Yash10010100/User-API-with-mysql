import express from "express"
import morgan from "morgan"
import { logger } from "./middlewares/logger.middleware.js"
import { userRouter } from "./routes/user.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js"
import { ApiResponse } from "./utils/ApiResponse.js"

const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(logger())      // Custom logger middleware to log request details in log file

app.use(morgan("dev"))

app.get("/api/v1", async (req, res) => {
    res
        .status(200)
        .json(null, new ApiResponse(200, "Hello from the server!"))
})

app.use("/api/v1/users", userRouter)

app.use(errorHandler)

export { app }