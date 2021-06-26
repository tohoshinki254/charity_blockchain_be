const { getKeyPairFromPrivateKey, verifyUnspentTxOut } = require("../utils/commonUtils");
const TxIn = require('../transaction/TxIn');
const TxOut = require('../transaction/TxOut');
const Transaction = require('../transaction/index');
const { pool } = require("../server/data");

class Wallet {
    constructor(privateKey, name) {
        this.keyPair = getKeyPairFromPrivateKey(privateKey);
        this.address = this.keyPair.getPublic().encode("hex", false);
        this.name = name;
    }
 
    getAddress = () => {
        return this.address;
    }

    getName = () => {
        return this.name;
    }

    getBalance = (unspentTxOuts, pool) => {
        let balance = 0;

        for (let [key, val] of unspentTxOuts) {
            if (val.address === this.address) {
                balance += val.amount;
            }
        }

        for (let i = 0; i < pool.transactions.length; i++) {
            for (let j = 0; j < pool.transactions[i].txOuts.length; j++) {
                if (pool.transactions[i].txOuts[j].address.localeCompare(this.address) == 0) {
                    balance = balance + pool.transactions[i].txOuts[j].amount;
                }
            }
        }

        return balance;
    }

    findTxOutsForAmount = (amount, unspentTxOuts) => {
        let includedTxOuts = [];
        let remainAmount = 0;
        let curAmount = 0;

        for (const [key, unspentTxOut] of unspentTxOuts) {
            if (this.address === unspentTxOut.address && !unspentTxOut.inPool) {
                curAmount += unspentTxOut.amount;
                includedTxOuts.push(unspentTxOut);

                if (curAmount >= amount) {
                    remainAmount = curAmount - amount;
                    return {includedTxOuts, remainAmount};
                }
            }
        }
        return {includedTxOuts: null, remainAmount: null};
    }

    createTransaction = (receiptAddress, amount, unspentTxOuts) => {
        const { includedTxOuts, remainAmount } = this.findTxOutsForAmount(amount, unspentTxOuts);

        if (includedTxOuts !== null && remainAmount !== null) {
            const txOut = new TxOut(receiptAddress, amount);
            let txRemain = null;
            if (remainAmount > 0) {
                txRemain = new TxOut(this.address, remainAmount);
            }
            const txIns = includedTxOuts.map((unspentTxOut) => {
                const txIn = new TxIn(unspentTxOut.txOutId, unspentTxOut.txOutIndex, null);
                return txIn;
            });

            const transaction = new Transaction(this.address, txIns, [txOut, txRemain], amount);
            transaction.hashData();
            console.log(transaction);
            this.signTransaction(transaction, unspentTxOuts);
            
            console.log(transaction);
            return transaction;
        } else {
            let balance = this.getBalance(unspentTxOuts, pool);
            if (balance >= amount) {
                throw new Error("You have enough money, but please wait for your transactions complete")
            }
            else {
                throw new Error('You are not enough money to send.');
            }
        }
    }

    addMoneyToWallet = (amount) => {
        const txOut = new TxOut(this.address, amount);
        const transaction = new Transaction(null, [], [txOut], amount);
        return transaction;
    }

    signTransaction = (transaction, unspentTxOuts) => {
        if (transaction.senderAddress != this.address) {
            throw new Error('Transaction address is not match.');
        }

        transaction.txIns.forEach((txIn) => {
            if (!verifyUnspentTxOut(txIn.txOutId, this.address, unspentTxOuts)) {
                throw new Error('Transaction address is not match.');
            }

            txIn.signature = this.keyPair.sign(transaction.hashData());
        });
    }
}

module.exports = Wallet;