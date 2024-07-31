const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.MONGO_URL

const connect = () => {
    mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true

    })
        .then(() => console.log('connect db sucess'))
        .catch((err) => console.log('connect err', err))
}

module.exports = connect
