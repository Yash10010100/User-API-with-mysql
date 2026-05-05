export class ApiResponse {
    constructor(statuscode, message, data) {
        this.statuscode = statuscode
        this.message = message
        this.data = data
    }

    toString() {
        return `{
    statuscode : ${this.statuscode},
    message : ${this.message},
    data : ${this.data ? JSON.stringify(this.data) : "N/A"}
}`
    }
}