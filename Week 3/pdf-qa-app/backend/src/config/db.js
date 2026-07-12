// import the pg library - this is the PostgreSQL client for Node.js
import pg from 'pg'

// import dotenv to load .env file variables into process.env
import dotenv from 'dotenv'

// actually loads the .env file - must call this before using process.env
dotenv.config()

// Pool manages multiple DB connections
// instead of opening/closing one connection per query (slow)
// Pool keeps N connections alive and reuses them across requests
const { Pool } = pg

// create the pool using DATABASE_URL from .env
// format: postgresql://user:password@host:port/dbname
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

// fires when a new connection is made to PostgreSQL
// just a startup log to confirm DB is reachable
pool.on('connect', () => {
    console.log('PostgreSQL connected')
})

// fires when an unexpected DB error occurs (connection dropped, timeout etc.)
// process.exit(-1) crashes the server loudly
// better to crash than silently serve broken responses
pool.on('error', (err) => {
    console.error('PostgreSQL error:', err)
    process.exit(-1)
})

// export pool so any route/file can import and run queries
// usage: pool.query('SELECT * FROM users WHERE id = $1', [id])
export default pool