import express from 'express'
import { getConversations } from '../controllers/conversations.controller.js'

const router = express.Router()

router.get('/:user_id', getConversations)

export default router