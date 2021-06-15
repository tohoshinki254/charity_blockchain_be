const Wallet = require('../../wallet');
const { accountMap, event } = require('../data/index');
const { getKeyPairFromPrivateKey } = require('../../utils/commonUtils');

const authenticateWallet = (req, res, next) => {
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

const authenticateEvent = (req, res, next) => {
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

    let curEvent = null;
    const keyPair = getKeyPairFromPrivateKey(privateKey);
    const address = keyPair.getPublic().encode("hex", false);
    for (let [key, val] of event) {
        if (address === key) {
            curEvent = val;
            break;
        }
    }

    if (curEvent === null) {
        res.status(401).json({
            message: 'wallet not found'
        });
        return;
    }

    req.curEvent = curEvent;
    next();
}

module.exports = { authenticateWallet, authenticateEvent };