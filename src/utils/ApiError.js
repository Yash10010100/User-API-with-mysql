export class ApiError extends Error {
    constructor(statuscode, message) {
        super(message)
        this.statuscode = statuscode
    }
}