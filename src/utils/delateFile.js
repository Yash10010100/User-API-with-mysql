import { rm } from "fs/promises"
import { resolve } from "path"

const deleteFile = async (fileName) => {
    const pathToDelete = resolve("./public/uploads", fileName)

    await rm(pathToDelete)
}

export {
    deleteFile
}