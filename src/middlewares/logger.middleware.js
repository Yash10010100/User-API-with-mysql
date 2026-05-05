import { createWriteStream } from "fs"
import { resolve } from "path"

const logger = () => {
    const writeStream = createWriteStream(resolve("./public/logs/logs.txt"), { encoding: "utf8", flags: "a" });

    writeStream.on("open", () => {
        console.log("Stream opened");
    })

    writeStream.on("error", (err) => {
        console.error("Logger error :", err);
    })

    process.on("SIGINT", () => {
        console.log("Closing the stream.....");
        writeStream.close(() => {
            console.log("Stream closed");
            process.exit(0)
        })
    })

    return async (req, res, next) => {

        const originalJson = res.json;

        res.json = function (reqbody, resbody, callOriginal = true, err) {
            let content = `------------------------------------------------------------------------\n${new Date().toLocaleString()} : "${req.method}" : "${req.originalUrl}" \nSearch query : ${JSON.stringify(req.query)} \nRequest Body : ${reqbody ? JSON.stringify(reqbody) : "N/A"}`;

            if (err) {
                content = `${content} \n!!!SERVER ERROR!!! \n${err.stack} \n---------------Response to client--------------- \nStatus Code : ${res.statusCode} \nResponse Body : ${resbody ? resbody.toString() : "N/A"} \n\n`;
            } else {
                content = `${content} \n---------------Response to client--------------- \nStatus Code : ${res.statusCode} \nResponse Body : ${resbody ? resbody.toString() : "N/A"} \n\n`;
            }

            writeStream.write(content, "utf8");

            return callOriginal && originalJson.call(this, resbody);
        };

        next();
    };
};

export { logger };
