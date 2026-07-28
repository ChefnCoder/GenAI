import express from 'express'
import multer from 'multer'
import { uploadPDF } from '../controllers/upload.controller.js'

const router = express.Router()

import fs from 'fs'

// ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true })
}

// multer config stays in route file — it's transport/middleware concern, not business logic
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(new Error('Only PDF files allowed'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
})

// route just wires middleware + controller together
router.post('/', upload.single('pdf'), uploadPDF)

export default router