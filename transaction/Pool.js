import { generateId, verifyTransaction } from '../utils/commonUtils';
import UnspentTxOut from './UnspentTxOut';

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

        let index = 0;
        validTransactions.forEach((transaction) => {
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

export default Pool;