// express is the HTTP framework - handles routing, middleware, requests
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// rateLimit middleware - limits how many requests one IP can make
// prevents API abuse, scraping, DDoS
import { rateLimit } from 'express-rate-limit'

// import all route handlers - each file handles one endpoint group
// import uploadRoute from './routes/upload.js'
// import chatRoute from './routes/chat.js'
// import conversationsRoute from './routes/conversations.js'
// import metricsRoute from './routes/metrics.js'

// global error handler - catches all errors thrown in routes
import errorHandler from './middleware/errorHandler.js'

dotenv.config()

// create the Express app instance
const app = express()

// cors() - allows all origins by default
// in production you'd restrict to: cors({ origin: 'https://yourfrontend.vercel.app' })
app.use(cors())

// express.json() - parses incoming JSON request bodies
// without this, req.body is undefined for JSON requests
app.use(express.json())

// rate limiter config:
// windowMs: 15 minutes window
// max: 100 requests per IP per window
// after 100 requests → returns 429 with the error message
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes in milliseconds
    max: 100,
    message: { error: 'Too many requests, slow down.' }
})

// apply rate limiter to ALL routes
app.use(limiter)

// mount routes at their base paths
// POST /upload → handled by uploadRoute
// POST /chat → handled by chatRoute
// GET /conversations/... → handled by conversationsRoute
// GET /metrics/... → handled by metricsRoute

// app.use('/upload', uploadRoute)
// app.use('/chat', chatRoute)
// app.use('/conversations', conversationsRoute)
// app.use('/metrics', metricsRoute)

// health check endpoint - used by Railway/Render to verify app is alive
// returns 200 OK with timestamp - no auth needed
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// error handler MUST be last middleware
// Express identifies it as error handler because it has 4 params (err, req, res, next)
app.use(errorHandler)

// read PORT from .env or default to 5000
// Railway injects its own PORT automatically via process.env.PORT
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

export default app