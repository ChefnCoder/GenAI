import express from 'express'
import { getMetrics } from '../controllers/metrics.controller.js'

const router = express.Router()

router.get('/:pdf_id', getMetrics)

export default router