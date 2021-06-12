import { convertTransactionFromChain, convertTransactionInPool, generateKeyPair } from '../../utils/commonUtils';
import { blockchain, unspentTxOuts, pool, event, accountMap } from '../data/index';
import { Wallet } from '../../wallet/index';

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
        const address = keyPair.getPublic().encode("hex", false);

        accountMap.set(privateKey, new Wallet(privateKey));
        res.status(200).json({
            message: 'OK',
            payload: {
                privateKey: privateKey,
                address: address
            }
        });
    },

    accessWallet: (req, res, next) => {
        try {
            const privateKey = req.query.privateKey;
            if (privateKey === undefined || (privateKey.match('^[a-fA-F0-9]+$') === null)) {
                return res.status(400).json({
                    "message": "private key not found or invalid"
                })
            }
            
            for (let [key, val] of accountMap) {
                if (privateKey === key) {
                    res.status(200).json({
                        message: 'OK'
                    });
                    return;
                }
            }

            res.status(400).json({
                message: 'private key not found'
            });
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    getWalletInfo: (req, res, next) => {
        const privateKey = req.query.privateKey;
        const wallet = accountMap.get(privateKey);

        return res.status(200).json({
            message: 'OK',
            payload: {
                address: wallet.getAddress(),
                balance: wallet.getBalance(unspentTxOuts)
            }
        });
    },

    // addMoneyToWallet: (req, res, next) => {
    //     try {
    //         const money = req.money;
    //         const block = generateNextBlock()

    //     }
    //     catch (e) {
    //         res.status(500).json({
    //             message: e.message
    //         })
    //     }



    // },

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
    },

    createTransaction: (req, res, next) => {
        try {
            let { senderPrivate, receiptAddress, amount } = req.body;
            if (!receiptAddress || !amount) {
                res.status(400).json({
                    message: 'receipt address or amount are not found.'
                });
                return;
            }

            amount = Number.parseInt(amount);
            if (isNaN(amount)) {
                res.status(400).json({
                    message: 'amount must be a number.'
                });
                return;
            }

            const wallet = accountMap.get(privateKey);
            const transaction = wallet.createTransaction(receiptAddress, amount, unspentTxOuts);
            wallet.signTransaction(transaction);

            pool.addTransaction(transaction, unspentTxOuts);

            res.status(200).json({
                message: 'OK'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getTransactionInPool: (req, res, next) => {
        try {
            const payload = pool.transactions.map((transaction) => {
                return {
                    sender: transaction.senderAddress,
                    receipt: transaction.txOuts[0].address,
                    amount: transaction.txOuts[0].amount
                }
            });

            res.status(200).json({
                message: 'OK',
                payload
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getHistory: (req, res, next) => {
        try {
            const blocks = blockchain.chain;
            const transactions = [...convertTransactionFromChain(blocks), ...convertTransactionInPool(pool.transactions)];

            res.status(200).json({
                message: 'OK',
                payload: {
                    blocks,
                    transactions
                }
            }); 
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },


}