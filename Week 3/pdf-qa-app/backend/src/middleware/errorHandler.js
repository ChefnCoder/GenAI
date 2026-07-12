// Express error handler middleware
// 4 parameters = Express treats this as error handler, not regular middleware
// err = the error object thrown anywhere in the app
const errorHandler = (err, req, res, next) => {

    // log the error with timestamp for debugging
    // in production you'd send this to a logging service like Datadog
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message)

    // err.status = custom status code if you set it when throwing
    // example: const err = new Error('Not found'); err.status = 404; next(err)
    // falls back to 500 (Internal Server Error) if no status set
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    })
}

export default errorHandler