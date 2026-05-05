import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const errorHandler = (err, req, res, next) => {

    if (err instanceof ApiError) {
        console.error("API ERROR :", err.message);
        res
            .status(err.statuscode)
            .json(req.body, new ApiResponse(err.statuscode, err.message))
    } else {
        console.error("SERVER ERROR :", err);

        res
            .status(500)
            // .json(req.body, new ApiResponse(500, "Something went wrong, please try again"), true, null, null, err)
            .json(req.body, new ApiResponse(500, "Something went wrong, please try again"), true, err)
    }
}

export { errorHandler }