import { getPDFMetrics, getUserMetrics } from '../services/metrics.service.js'

export const getMetrics = async (req, res, next) => {
    try {
        const { pdf_id } = req.params

        if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' })

        const metrics = await getPDFMetrics(pdf_id)
        res.status(200).json(metrics)

    } catch (err) {
        next(err)
    }
}

export const getMetricsByUser = async (req, res, next) => {
    try {
        const { user_id } = req.params

        if (!user_id) return res.status(400).json({ error: 'user_id is required' })

        const metrics = await getUserMetrics(user_id)
        res.status(200).json(metrics)

    } catch (err) {
        next(err)
    }
}