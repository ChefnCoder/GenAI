import { processPDF } from '../services/upload.service.js'

export const uploadPDF = async (req, res, next) => {
    try {
        // validate inputs — controller's only responsibility
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' })
        }
        if (!req.body.user_id) {
            return res.status(400).json({ error: 'user_id is required' })
        }

        // delegate ALL business logic to service
        const result = await processPDF(req.file, req.body.user_id)

        // send response
        res.status(200).json(result)

    } catch (err) {
        next(err)
    }
}