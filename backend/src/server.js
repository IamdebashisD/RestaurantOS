import { createServer } from 'node:http'
import { app } from './app.js'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'


// Handle synchronous crashes before anything else runs
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception! Shutting down...", error)
    process.exit(1) 
})

// Handle asynchronous crashes safely
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection! Shutting down...", reason)
    process.exit(1)
})

export async function main() {
    try {
        await connectDatabase()

        const server = createServer(app())

        server.listen(env.port, () => {
            console.log(
                `✔ Server is running in ${env.nodeEnv} mode on http://localhost:${env.port}`
            )
        })
    } catch (error) {
        console.error(`Error starting http server: ${error.message}`)
        process.exit(1)
    }
}

main()
