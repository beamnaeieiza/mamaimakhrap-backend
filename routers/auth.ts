import express from 'express'

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Welcum to auth.zzawdwadazz')
})

export default router