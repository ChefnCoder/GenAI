import express from 'express'
import { getMetrics, getMetricsByUser } from '../controllers/metrics.controller.js'

const router = express.Router()

router.get('/user/:user_id', getMetricsByUser)
router.get('/:pdf_id', getMetrics)

export default router