const admin = async (req, res, next) => {
    try {
        if (req.user.type === "Administrateur") {
            next();
        } else {
            res.status(403).send({ error: 'Unhautorized' }) //if not athenticated error
        }

    } catch (error) {
        res.status(403).send({ error: 'Unhautorized' }) //if not athenticated error
    }
}
module.exports = admin