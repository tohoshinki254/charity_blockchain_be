import { generateKeyPair } from '../../utils/commonUtils';
import { blockchain, unspentTxOuts, pool } from '../data/index';
import fs from 'fs';

module.exports = {
    getBlocks: (req, res, next) => {
        res.status(200).json({
            message: "OK",
            payload: blockchain.chain
        });
    },

    createWallet: (req, res, next) => {
        const keyPair = generateKeyPair();
        const privateKey = keyPair.getPrivate.toString(16);

        fs.writeFileSync(process.env.PRIVATE_KEY_PATH, privateKey);

        res.download(process.env.PRIVATE_KEY_PATH);
    },

    getWalletInfo: (req, res, next) => {
        const wallet = req.myWallet;
        return res.status(200).json({
            message: 'OK',
            payload: {
                address: wallet.address,
                balance: wallet.getBalance(unspentTxOuts);
            }
        });
    },


}