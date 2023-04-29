import express from 'express'
let app = express()
import authRouter from "./routers/auth"

app.use('/auth', authRouter)

app.get('/', (req, res) => {
    res.send('Hello kuy')
})

app.listen(8080, () => {
    console.log('Application is running.')
});