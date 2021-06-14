const Wallet = require('../../wallet');
const { accountMap } = require('../data/index');

const authenticate = (req, res, next) => {
    const privateKey = req.headers.authorization;

    if (!privateKey) {
        res.status(404).json({
            message: 'private key not found'
        });
        return;
    }

    if (privateKey.length != 64) {
        res.status(400).json({
            message: 'private key wrong format'
        });
        return;
    }

    let myWallet = null;
    for (let [key, val] of accountMap) {
        if (privateKey === key) {
            myWallet = val;
            break;
        }
    }

    if (myWallet === null) {
        res.status(401).json({
            message: 'wallet not found'
        });
        return;
    }

    req.myWallet = myWallet;
    next();
};

module.exports = { authenticate };