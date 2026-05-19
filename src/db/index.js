import { createPool } from "mysql2/promise";

const pool = createPool({
    host: "localhost",
    user: "root",
    port: 3306,
    database: "user_api_db",
    connectionLimit: 15,
    maxIdle: 10,
    resetOnRelease: true,
    waitForConnections: true,
    queueLimit: 5,
    timezone: "z",
    // dateStrings: ["TIMESTAMP"]
})

const connect = async () => {
    console.log("Connecting to database.....");

    await using con = await pool.getConnection()

    return await con.ping()
}

const query = async (options, values) => {
    return await pool.query(options, values)
}

const execute = async (options, values) => {
    return await pool.execute(options, values)
}

export {
    connect,
    query,
    execute
}