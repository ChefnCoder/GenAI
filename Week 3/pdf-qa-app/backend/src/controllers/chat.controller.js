import { processChat } from '../services/chat.service.js'

export const chat = async (req, res, next) => {
    try {
        const { pdf_id, user_id, message, conversation_id } = req.body

        // validate all required fields
        if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })
        if (!user_id) return res.status(400).json({ error: 'user_id is required' })
        if (!message) return res.status(400).json({ error: 'message is required' })

        const result = await processChat({ pdf_id, user_id, message, conversation_id })

        res.status(200).json(result)

    } catch (err) {
        next(err)
    }
}