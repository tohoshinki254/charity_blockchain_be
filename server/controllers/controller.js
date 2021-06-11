import { generateKeyPair, getKeyPairFromPrivateKey } from '../../utils/commonUtils';
import { blockchain, unspentTxOuts, pool, event } from '../data/index';
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

    accessWallet: (req, res, next) => {
        try {
            const privateKey = req.query.privateKey;
            if (privateKey === undefined || (privateKey.match('^[a-fA-F0-9]+$') === null)) {
                return res.status(400).json({
                    "message": "private key not found or invalid"
                })
            }
            // const keyPair = getKeyPairFromPrivateKey(privateKey);
            fs.writeFileSync(process.env.PRIVATE_KEY_PATH, privateKey);
            res.download(process.env.PRIVATE_KEY_PATH);
            // re
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
       

    },

    getWalletInfo: (req, res, next) => {
        const wallet = req.myWallet;
        return res.status(200).json({
            message: 'OK',
            payload: {
                address: wallet.address,
                balance: wallet.getBalance(unspentTxOuts)
            }
        });
    },

    addMoneyToWallet: (req, res, next) => {
        try {
            const money = req.money;
            const block = generateNextBlock()

        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }



    },

    createEvent: (req, res, next) => {
        try {
            const keyPair = generateKeyPair();
            const privateKey = keyPair.getPrivate.toString(16);
            const address = keyPair.getPublic().encode("hex", false);
            const { name, description, creator, startDate, endDate } = req.body;
            
            const start = startDate.split("/");
            const end = endDate.split("/");

            const newEvent = new Event(address, name, description, creator, 
                new Date(start[2], start[1], start[0]), new Date(end[2], end[1], end[0]));
            event.push(newEvent);

            res.status(200).json({
                message: 'OK',
                payload: {
                    privateKey: privateKey,
                    address: address,
                }
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    
    }

    
}