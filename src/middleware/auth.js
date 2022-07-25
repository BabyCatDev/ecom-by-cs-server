const jwt = require('jsonwebtoken')
const User = require('../models/user')
require('dotenv').config()

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '') //Looks for the header that the user supposed to provide
        const decoded = jwt.verify(token, process.env.JWT_SECRET) //Validate the header
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }) //Find the associated user

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next() 

    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' }) //if not athenticated error
    }
}
module.exports = auth