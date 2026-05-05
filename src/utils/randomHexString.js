import { randomFillSync } from "crypto"

export const generateRandomHex = (size = 24) => {
    return randomFillSync(Buffer.alloc(size / 2)).toString('hex')
}