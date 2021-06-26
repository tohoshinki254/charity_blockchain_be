const { convertTransactionFromChain, convertTransactionInPool, generateKeyPair, getMyTransactions } = require('../../utils/commonUtils');
const { blockchain, unspentTxOuts, pool, event, accountMap, peerHttpPortList, senderSockets } = require('../data/index');
const Wallet = require('../../wallet');
const Event = require('../../event');
const { connectToPeers, broadcast } = require('../../utils/p2pUtils');
const { MessageTypeEnum } = require('../../utils/constants');
const { messageUpdateBlockchain, messageUpdateTransactionPool, messageAddEvents, messageDisbursement, messageForceEndEvent } = require('../messages/message');
const { getTotalDisbursement } = require('../../utils/chainUtils');

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
                address: address,
                name: name
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
                balance: wallet.getBalance(unspentTxOuts, pool),
                name: wallet.getName()
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
            pool.addTransaction(transaction, unspentTxOuts);

            const validTransactions = pool.getValidTransaction();
            validTransactions.forEach(tx => {
                tx.txOuts.forEach(txOut => {                         
                    if (event.get(txOut.address) !== undefined) {                                 
                        event.get(txOut.address).amountDonated = event.get(txOut.address).amountDonated + txOut.amount;
                    }
                })
            })

            const newBlock = blockchain.addBlock(validTransactions);
            pool.clearTransaction(unspentTxOuts);


            broadcast(messageUpdateBlockchain);


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
            const creator = wallet.getAddress();
            const creatorName = wallet.getName();
            const { name, description, startDate, endDate } = req.body;

            const start = startDate.split("/");
            const end = endDate.split("/");

            const newEvent = new Event(address, name, description, creator, creatorName, new Date(start[2], start[1] - 1, start[0]), new Date(end[2], end[1] - 1, end[0]));
            newEvent.acceptEvent(creator);
            event.set(address, newEvent);

            broadcast(messageAddEvents(event));

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
        const targetEvent = event.get(eventId);

        const wallet = req.myWallet;
        const publicKey = wallet.keyPair.getPublic().encode("hex", false);

        if (targetEvent === undefined) {
            res.status(400).json({
                message: 'event address not found'
            });
            return;
        }

        if (targetEvent.status === 1) {
            res.status(400).json({
                message: 'Event has been accepted'
            });
            return;
        }
        else if (targetEvent.status === 2) {
            res.status(400).json({
                message: 'Event has been stopped'
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

        broadcast(messageAddEvents(eventId, publicKey));

        res.status(200).json({
            message: 'OK'
        })
    },

    checkAccepted: (req, res, next) => {
        try {
            const address = req.body.address;
            console.log(req.query.address);
            const wallet = req.myWallet;
            const publicKey = wallet.keyPair.getPublic().encode("hex", false);

            const curEvent = event.get(address);
            let result = true;
            if (!curEvent.acceptPeople.has(publicKey)) {
                result = false;
            }

            res.status(200).json({
                message: 'OK',
                accepted: result
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
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

            let donateHistory = [];
            console.log("Get event donate history")
            console.log(blockchain.chain)

            for (let i = 0; i < blockchain.chain.length; i++) {
                for (let j = 0; j < blockchain.chain[i].data.length; j++) {
                    let transaction = blockchain.chain[i].data[j]

                    console.log("blockchain - ", i, " - ", j);
                    console.log(transaction);

                    // for (let k = 0; k < transaction.length; k++) {
                        // if (transactions[k].senderAddress !== eventAddress) {
                        let t = [];
                        for (let l = 0; l < transaction.txOuts.length; l++) {
                            if (event.has(transaction.txOuts[l].address)) {
                                t.push(transaction.txOuts[l]);
                            }
                        }


                        t.forEach(tx => {
                            tx.senderAddress = transaction.senderAddress;
                            tx.id = transaction.id;
                            tx.timestamp = transaction.timestamp;
                            tx.name = event.get(tx.address).name;
                            tx.isSent = true;
                        })

                        donateHistory = donateHistory.concat(t);
                        // }
                    // }
                }
            }

            console.log("pool");
            console.log(pool);

            for (let i = 0; i < pool.transactions.length; i++) {
                console.log(pool.transactions[i]);
                console.log(eventAddress);

                if (pool.transactions[i].senderAddress !== eventAddress) {
                    console.log("Here")
                    console.log(pool.transactions[i].txOuts);

                    let t = [];
                    for (let j = 0; j < pool.transactions[i].txOuts.length; j++) {
                        let lm = pool.transactions[i].txOuts[j].address.localeCompare(eventAddress);
                        if (lm == 0) {
                            t.push(pool.transactions[i].txOuts[j]);
                        }

                    }


                    console.log("t = ");
                    console.log(t);
                    t.forEach(tx => {
                        tx.senderAddress = pool.transactions[i].senderAddress;
                        tx.id = pool.transactions[i].id;
                        tx.timestamp = pool.transactions[i].timestamp;
                        tx.name = event.get(eventAddress).name;
                        tx.isSent = false;
                    })

                    donateHistory = donateHistory.concat(t);
                }
            }

            res.status(200).json({
                message: 'OK',
                payload: {
                    history: donateHistory
                }
            })

            // const history = pool.filter(transact => {
            //     for (let i = 0; i < transact.txOuts.length; i++) {
            //         if (transact.txOuts[i].localeCompare(eventAddress)) {
            //             return true;
            //         }
            //     }
            //     return false;
            // })

            // const ret = history.map(transact => {
            //     const moneyReceived = transact.txOuts.find(element => element.address.localeCompare(eventAddress) === true).amount;
            //     return {
            //         senderAddress: transact.senderAddress,
            //         moneyReceived: moneyReceived,
            //         timestamp: transact.timestamp
            //     }
            // });
            // return ret;
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    getAllEventDonateHistory: (req, res, next) => {
        try {

            let donateHistory = [];
            console.log("Get all event donate history")
            console.log(blockchain.chain)

            for (let i = 0; i < blockchain.chain.length; i++) {
                for (let j = 0; j < blockchain.chain[i].data.length; j++) {
                    let transaction = blockchain.chain[i].data[j]

                    console.log("blockchain - ", i, " - ", j);
                    console.log(transaction);

                    // for (let k = 0; k < transaction.length; k++) {
                        // if (transactions[k].senderAddress !== eventAddress) {
                        let t = [];
                        for (let l = 0; l < transaction.txOuts.length; l++) {
                            if (event.has(transaction.txOuts[l].address)) {
                                t.push(transaction.txOuts[l]);
                            }
                        }


                        t.forEach(tx => {
                            tx.senderAddress = transaction.senderAddress;
                            tx.id = transaction.id;
                            tx.timestamp = transaction.timestamp;
                            tx.name = event.get(tx.address).name;
                            tx.isSent = true;
                        })

                        donateHistory = donateHistory.concat(t);
                        // }
                    // }
                }
            }

            console.log("pool");
            console.log(pool);

            for (let i = 0; i < pool.transactions.length; i++) {
                console.log(pool.transactions[i]);
                // console.log(eventAddress);

                // if (pool.transactions[i].senderAddress !== eventAddress) {
                console.log("Here")
                console.log(pool.transactions[i].txOuts);

                let t = [];
                for (let j = 0; j < pool.transactions[i].txOuts.length; j++) {
                    if (event.has(pool.transactions[i].txOuts[j].address)) {
                        t.push(pool.transactions[i].txOuts[j]);
                    }
                }

                console.log(t);

                t.forEach(tx => {
                    tx.senderAddress = pool.transactions[i].senderAddress;
                    tx.id = pool.transactions[i].id;
                    tx.timestamp = pool.transactions[i].timestamp;

                

                    tx.name = event.get(tx.address).name;
                    tx.isSent = false;
                })

                donateHistory = donateHistory.concat(t);
                // }
            }

            res.status(200).json({
                message: 'OK',
                payload: {
                    history: donateHistory
                }
            })
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

            let disbursementHistory = [];

            for (let i = 0; i < blockchain.chain.length; i++) {
                for (let j = 0; j < blockchain.chain[i].data.length; j++) {
                    let transactions = blockchain.chain[i].data[j]
                    for (let k = 0; k < transactions.length; k++) {
                        let isSame = transactions[k].senderAddress.localeCompare(eventAddress);
                        if (isSame == 0) {
                            disbursementHistory.push({
                                id: transactions[k].id,
                                timestamp: transactions[k].timestamp,
                                amount: transactions[k].amount
                            })
                        }
                    }
                }
            }

            res.status(200).json({
                message: 'OK',
                payload: {
                    history: disbursementHistory
                }
            })
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

            pool.addTransaction(disbursement, unspentTxOuts);

            const validTransactions = pool.getValidTransaction();
            if (validTransactions.length >= 2) {
                validTransactions.forEach(tx => {
                    tx.txOuts.forEach(txOut => {                         
                        if (event.get(txOut.address) !== undefined) {                                 
                            event.get(txOut.address).amountDonated = event.get(txOut.address).amountDonated + txOut.amount;
                        }
                    })
                })

                const newBlock = blockchain.addBlock(validTransactions);
                pool.clearTransaction(unspentTxOuts);
            }

            broadcast(messageDisbursement(amount, curEvent));

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
                
                if (receiptEvent.status !== 1) {
                    res.status(400).json({
                        message: 'Event has not accepted yet'
                    })
                }

                const current = new Date();
                if (receiptEvent.endDate < current) {
                    receiptEvent.endEvent();
                } else {
                    console.log("A");
                    const transaction = wallet.createTransaction(receiptAddress, amount, unspentTxOuts);
                    console.log("B");
                    pool.addTransaction(transaction, unspentTxOuts);
                    console.log("C");
                    const validTransactions = pool.getValidTransaction();
                    if (validTransactions.length >= 2) {
                        validTransactions.forEach(tx => {
                            tx.txOuts.forEach(txOut => {                         
                                if (event.get(txOut.address) !== undefined) {                                 
                                    event.get(txOut.address).amountDonated = event.get(txOut.address).amountDonated + txOut.amount;
                                }
                            })
                        })

                        const newBlock = blockchain.addBlock(validTransactions);
                        pool.clearTransaction(unspentTxOuts);
                    }
                    console.log("D");
                    broadcast(messageUpdateTransactionPool);

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
            const transactions = getMyTransactions(wallet.address, blockchain.chain, event, pool);

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
                const curEvent = {
                    event: val,
                    percentAccepted: (val.status >= 1 ? 1 : val.acceptPeople.size / accountMap.size),
                    totalDisbursement: getTotalDisbursement(val.creator)
                };

                result.push(curEvent);
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
            const publicKey = wallet.keyPair.getPublic().encode("hex", false);

            let result = [];
            for (let [key, val] of event) {
                if (val.creator === publicKey) {
                    const curEvent = {
                        event: val,
                        percentAccepted: (val.status >= 1 ? 1 : val.acceptPeople.size / accountMap.size),
                        totalDisbursement: getTotalDisbursement(val.creator)
                    };

                    result.push(curEvent);
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

            broadcast(messageForceEndEvent(curEvent));

            res.status(200).json({
                message: 'OK'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getEventByAddress: (req, res, next) => {
        try {
            const { address } = req.query;
            const curEvent = event.get(address);

            if (curEvent !== undefined && curEvent !== null) {
                res.status(200).json({
                    message: 'OK',
                    event: curEvent,
                    percentAccepted: (curEvent.status >= 1 ? 1 : curEvent.acceptPeople.size / accountMap.size),
                    totalDisbursement: getTotalDisbursement(curEvent.creator)
                });
                return;
            }

            res.status(400).json({
                message: 'event not found'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    },

    getTransactionById: (req, res, next) => {
        try {
            const { id } = req.query;
            const transactions = [...convertTransactionFromChain(blocks, event), ...convertTransactionInPool(pool.transactions, event)];

            transactions.forEach((tx) => {
                if (tx.id === id) {
                    res.status(200).json({
                        message: 'OK',
                        payload: tx
                    });
                    return;
                }
            });

            res.status(400).json({
                message: 'transaction not found'
            });
        } catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    //---------------------------------------------------
    //P2P
    //---------------------------------------------------

    getPeers: (req, res, next) => {
        try {
            console.log("Get peers");
            let list = peerHttpPortList;

            res.status(200).send(list);
        } catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    getSenderSockets: (req, res, next) => {
        try {
            res.send(senderSockets.map(s => s.io.uri));
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    },

    addPeers: (req, res, next) => {
        try {
            connectToPeers(req.body.peer, req.body.httpPort);
            res.status(200).json({
                message: 'OK'
            })
        }
        catch (e) {
            res.status(500).json({
                message: e.message
            })
        }
    }
}