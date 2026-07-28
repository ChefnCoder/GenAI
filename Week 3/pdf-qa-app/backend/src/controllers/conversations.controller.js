import { getUserConversations, getConversationMessages } from '../services/conversations.service.js'

export const getConversations = async (req, res, next) => {
    try {
        const { user_id } = req.params
        // optional query param: ?conversation_id=xxx to get messages
        const { conversation_id } = req.query

        if (conversation_id) {
            // return messages for specific conversation
            const messages = await getConversationMessages(conversation_id)
            return res.status(200).json(messages)
        }

        // return all conversations for user
        const conversations = await getUserConversations(user_id)
        res.status(200).json(conversations)

    } catch (err) {
        next(err)
    }
}