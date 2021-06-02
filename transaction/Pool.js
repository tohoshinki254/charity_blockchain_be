import { generateId } from '../utils/commonUtils';
import UnspentTxOut from './UnspentTxOut';

class Pool {
    constructor() {
        this.transactions = [];
    }

    addTransaction(transaction, unspentTxOuts) {
        transaction.txIns.forEach((txIn) => {
            unspentTxOuts.delete(txIn.txOutId);
        });

        const unspentTxOut = new UnspentTxOut(
            generateId(),
            transaction.txOuts[0].address,
            transaction.txOuts[0].amount
        );

        unspentTxOuts.set(unspentTxOut.txOutId, unspentTxOut);

        this.transactions.push(transaction);
    }
}

export default Pool;