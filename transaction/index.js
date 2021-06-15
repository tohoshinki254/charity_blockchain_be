const { hash } = require('../utils/commonUtils');

class Transaction {
    constructor(senderAddress, txIns, txOuts) {
        this.id = null;
        this.senderAddress = senderAddress;
        this.txIns = txIns;
        this.txOuts = txOuts;
        this.timestamp = Date.now();
    }

    hashData = () => {
        const txInContent = transaction.txIns
            .map((txIn) => txIn.txOutId + txIn.txOutIndex)
            .reduce((a, b) => a + b, '');
    
        const txOutContent = transaction.txOuts
            .map((txOut) => txOut.address + txOut.amount)
            .reduce((a, b) => a + b, '');

        this.id = hash(txInContent + txOutContent);
        return this.id;
    }
}   

module.exports = Transaction;