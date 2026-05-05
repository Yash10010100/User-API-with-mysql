import { connect } from "./db/index.js";
import { app } from "./app.js";
import { configDotenv } from "dotenv";

configDotenv({
    path: "./.env"
})

const PORT = Number(process.env.SERVER_PORT)

connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}.....`);
        })
    })
    .catch(err => {
        console.error("Database connection failed, exiting the program.....");
        process.exit(1)
    })