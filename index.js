require('dotenv').config()
const express = require('express')
const app = require('./app.js')
const cors = require('cors')
const morgan = require('morgan')
const config = require('./utils/config.js');
const logger = require('./utils/logger.js');
const { errorHandler } = require('./utils/middleware.js');

app.use(cors())
app.use(express.json())
morgan.token('body', function (req) { return JSON.stringify(req.body) })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(errorHandler)

app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)
})