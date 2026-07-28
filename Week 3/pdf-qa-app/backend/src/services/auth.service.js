import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'documind_secret_jwt_key_2026_super_secure'

export const registerUser = async ({ email, password }) => {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 })
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existingUser.rows.length > 0) {
    throw Object.assign(new Error('User already exists with this email'), { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, password_hash]
  )

  const user = result.rows[0]
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

  return { user, token }
}

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 })
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 })
  }

  const user = result.rows[0]
  if (!user.password_hash) {
    throw Object.assign(new Error('Password login not configured for this user'), { status: 401 })
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 })
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

  return {
    user: { id: user.id, email: user.email, created_at: user.created_at },
    token
  }
}
