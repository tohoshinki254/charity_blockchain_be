import { hash } from '../utils/commonUtils';
import TxIn from './TxIn';
import TxOut from './TxOut';

class Transaction {
    constructor(id, txIns, txOuts, senderName, receiverName) {
        this.id = id;
        this.txIns = txIns;
        this.txOuts = txOuts;
        this.timestamp = Date.now();
        this.senderName = senderName;
        this.receiverName = receiverName;
    }

    hashData() {
        const txInContent = transaction.txIns
            .map((txIn) => txIn.txOutId + txIn.txOutIndex)
            .reduce((a, b) => a + b, '');
    
        const txOutContent = transaction.txOuts
            .map((txOut) => txOut.address + txOut.amount)
            .reduce((a, b) => a + b, '');

        return hash(txInContent + txOutContent);
    }
}   

export default Transaction;