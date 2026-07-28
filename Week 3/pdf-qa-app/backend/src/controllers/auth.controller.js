import { registerUser, loginUser } from '../services/auth.service.js'

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await registerUser({ email, password })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await loginUser({ email, password })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
