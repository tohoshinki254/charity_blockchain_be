const { generateId, verifyTransaction } = require('../utils/commonUtils');
const UnspentTxOut = require('./UnspentTxOut');

class Pool {
    constructor() {
        this.transactions = [];
    }

    addTransaction = (transaction, unspentTxOuts) => {
        transaction.txIns.forEach((txIn) => {
            unspentTxOuts.delete(txIn.txOutId);
        });

        this.transactions.push(transaction);
    }

    getValidTransaction = () => {
        const validTransactions = [];

        this.transactions.forEach((transaction) => {
            if (verifyTransaction(transaction.senderAddress, transaction)) {
                validTransactions.push(transaction);
            }
        });

        return validTransactions;
    }

    getInvalidTransaction = () => {
        const invalidTransactions = [];

        this.transactions.forEach((transaction) => {
            if (!verifyTransaction(transaction.senderAddress, transaction)) {
                invalidTransactions.push(transaction);
            }
        });

        return invalidTransactions;
    }

    clearTransaction = (unspentTxOuts) => {
        const validTransactions = this.getValidTransaction();

        validTransactions.forEach((transaction) => {
            let index = 0;
            transaction.txOuts.forEach((txOut) => {
                const unspentTxOut = new UnspentTxOut(
                    generateId(),
                    index++,
                    txOut.address,
                    txOut.amount
                );

                unspentTxOuts.set(unspentTxOut.txOutId, unspentTxOut);
            })
        });

        this.transactions = this.getInvalidTransaction();
    }
}

module.exports = Pool;