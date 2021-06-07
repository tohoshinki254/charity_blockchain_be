import { getKeyPairFromPrivateKey, verifyUnspentTxOut } from "../utils/commonUtils";
import TxIn from '../transaction/TxIn';
import TxOut from '../transaction/TxOut';
import Transaction from '../transaction/index';

class Wallet {
    construct(privateKey) {
        this.keyPair = getKeyPairFromPrivateKey(privateKey);
        this.address = this.keyPair.getPublic().encode("hex", false);
    }

    getBalance = (unspentTxOuts) => {
        let balance = 0;

        unspentTxOuts.forEach((unspentTxOut) => {
            if (unspentTxOut.address === this.address && !unspentTxOut.inPool) {
                balance += unspentTxOut.amount;
            }
        });

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
            const txIns = includedTxOuts.map((unspentTxOut) => {
                const txIn = new TxIn(unspentTxOut.txOutId, unspentTxOut.txOutIndex, null);
                return txIn;
            });

            const transaction = new Transaction(this.address, txIns, [txOut]);

            return transaction;
        } else {
            throw new Error('You are not enough money to send.');
        }
    }

    signTransaction = (transaction, unspentTxOuts) => {
        if (transaction.senderAddress != this.address) {
            throw new Error('Transaction address is not match.');
        }

        transaction.txIns?.forEach((txIn) => {
            if (!verifyUnspentTxOut(txIn.txOutId, this.address, unspentTxOuts)) {
                throw new Error('Transaction address is not match.');
            }

            txIn.signature = this.keyPair.sign(transaction.hashData());
        })
    }
}

export default Wallet;