const { convertTransactionFromChain, convertTransactionInPool, generateKeyPair, getMyTransactions } = require('../../utils/commonUtils');
const { blockchain, unspentTxOuts, pool, event, accountMap } = require('../data/index');
const Wallet = require('../../wallet');
const Event = require('../../event');

module.exports = {
    getBlocks: (req, res, next) => {
        res.status(200).json({
            message: "OK",
            payload: blockchain.chain
        });
    },

    createWallet: (req, res, next) => {
        const keyPair = generateKeyPair();
        const privateKey = keyPair.getPrivate().toString(16);
        const address = keyPair.getPublic().encode("hex", false);
        let { name } = req.body;
        if (name === undefined || name === null) {
            name = "No Name"
        }

        accountMap.set(privateKey, new Wallet(privateKey, name));
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
            const wallet = req.myWallet;
            if (wallet === null) {
                res.status(401).json({
                    message: 'wallet not found'
                });
                return;
            }

            res.status(200).json({
                message: 'OK'
            });
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
                address: wallet.getAddress(),
                balance: wallet.getBalance(unspentTxOuts)
            }
        });
    },

    addAmountToWallet: (req, res, next) => {
        try {
            const wallet = req.myWallet;
            let amount = req.body.amount;

            amount = Number.parseInt(amount);
            if (isNaN(amount)) {
                res.status(400).json({
                    message: 'amount must be a number'
                });
                return;
            }

            const transaction = wallet.addMoneyToWallet(amount);
            const newBlock = blockchain.addBlock([transaction]);
            res.status(200).json({
                message: 'OK'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    createEvent: (req, res, next) => {
        try {
            const keyPair = generateKeyPair();
            const privateKey = keyPair.getPrivate().toString(16);
            const address = keyPair.getPublic().encode("hex", false);
            const wallet = req.myWallet;
            const creator = wallet.keyPair.getPrivate().toString(16);;
            const { name, description, startDate, endDate } = req.body;

            const start = startDate.split("/");
            const end = endDate.split("/");

            const newEvent = new Event(address, name, description, creator, new Date(start[2], start[1] - 1, start[0]), new Date(end[2], end[1] - 1, end[0]));
            event.set(address, newEvent);

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

    acceptEvent: (req, res, next) => {
        const eventId = req.body.address;
        const targetEvent = event[eventId];

        const wallet = req.myWallet;
        const publicKey = wallet.keyPair.getPublic().toString(16);

        if (targetEvent === undefined) {
            res.status(400).json({
                message: 'event address not found'
            });
            return;
        }

        let flag = targetEvent.acceptEvent(publicKey);
        if (flag === false) {
            res.status(400).json({
                message: 'user has accepted before'
            });
            return;
        }

        res.status(200).json({
            message: 'OK'
        })
    },

    getEventDonateHistory: (req, res, next) => {
        try {
            const eventAddress = req.query.address;
            const targetEvent = event.get(eventAddress);

            if (targetEvent === undefined) {
                res.status(400).json({
                    message: 'event address not found'
                });
            }

            const history = pool.filter(transact => {
                for (let i = 0; i < transact.txOuts.length; i++) {
                    if (transact.txOuts[i].localeCompare(eventAddress)) {
                        return true;
                    }
                }
                return false;
            })

            const ret = history.map(transact => {
                const moneyReceived = transact.txOuts.find(element => element.address.localeCompare(eventAddress) === true).amount;
                return {
                    senderAddress: transact.senderAddress,
                    moneyReceived: moneyReceived,
                    timestamp: transact.timestamp
                }
            });
            return ret;
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    getEventDisbursementHistory: (req, res, next) => {
        try {
            const eventAddress = req.query.address;
            const targetEvent = event.get(eventAddress);

            if (targetEvent === undefined) {
                res.status(400).json({
                    message: 'event address not found'
                });
            }

            const history = pool.filter(transact => {
                transact.senderAddress.localeCompare(eventAddress) === true;
            })

            const ret = history.map(transact => {
                const receiverInfo = transact.txOuts.find(element => element.address.localeCompare(eventAddress) === false);
                return {
                    receiverAddress: receiverInfo.address,
                    moneySent: receiverInfo.amount,
                    timestamp: transact.timestamp
                }
            });

            return ret;
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    disbursement: (req, res, next) => {
        try {
            let { amount } = req.body;
            const curEvent = req.curEvent;

            amount = Number.parseInt(amount);
            if (isNaN(amount)) {
                res.status(400).json({
                    message: 'amount must be a number'
                });
                return;
            }

            const disbursement = curEvent.createDisbursement(amount, unspentTxOuts);
            curEvent.signDisbursement(disbursement);

            pool.addTransaction(disbursement, unspentTxOuts);

            const validTransactions = pool.getValidTransaction();
            if (validTransactions.length >= 10) {
                const newBlock = blockchain.addBlock(validTransactions);
                pool.clearTransaction(unspentTxOuts);
            }

            res.status(200).json({
                message: 'OK'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    createTransaction: (req, res, next) => {
        try {
            let { receiptAddress, amount } = req.body;
            const wallet = req.myWallet;
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

            const receiptEvent = event.get(receiptAddress);
            if (receiptEvent !== undefined && receiptEvent !== null) {
                const current = new Date();
                if (receiptEvent.endDate < current) {
                    receiptEvent.endEvent();
                } else {
                    const transaction = wallet.createTransaction(receiptAddress, amount, unspentTxOuts);
                    wallet.signTransaction(transaction);
        
                    pool.addTransaction(transaction, unspentTxOuts);
        
                    const validTransactions = pool.getValidTransaction();
                    if (validTransactions.length >= 10) {
                        const newBlock = blockchain.addBlock(validTransactions);
                        pool.clearTransaction(unspentTxOuts);
                    }
        
                    res.status(200).json({
                        message: 'OK'
                    });
                    return;
                }
            }
            res.status(400).json({
                message: 'event is not found'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }, 

    getTransactionsByPrivateKey: (req, res, next) => {
        try {
            const wallet = req.myWallet;
            const transactions = getMyTransactions(wallet.address, blockchain.chain, event);

            res.status(200).json({
                message: 'OK',
                payload: {
                    transactions
                }
            });
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getBlockByIndex: (req, res, next) => {
        try {
            let index = req.query.index;

            index = Number.parseInt(index);
            if (!Number.isInteger(amount) || amount < 0 || amount >= blockchain.chain.length) {
                res.status(400).json({
                    message: 'Invalid index.'
                });
                return;
            }
            const block = blockchain.chain[index];

            return res.status(200).json({
                message: 'OK',
                payload: block
            })
        }
        catch (e) {
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
            const transactions = [...convertTransactionFromChain(blocks, event), ...convertTransactionInPool(pool.transactions, event)];

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

    getAllEvents: (req, res, next) => {
        try {
            let result = [];
            for (let [key, val] of event) {
                result.push(val);
            }

            res.status(200).json({
                message: 'OK',
                payload: {
                    events: result
                }
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getEventsByPrivateKey: (req, res, next) => {
        try {
            const wallet = req.myWallet;
            const privateKey = wallet.keyPair.getPrivate().toString(16);

            let result = [];
            for (let [key, val] of event) {
                if (val.creator === privateKey) {
                    result.push(val);
                }
            }

            res.status(200).json({
                message: 'OK',
                payload: {
                    events: result
                }
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    forceEndEvent: (req, res, next) => {
        try {
            const curEvent = req.curEvent;
            curEvent.endEvent();
            res.status(200).json({
                message: 'OK'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }
}