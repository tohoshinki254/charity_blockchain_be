const { event, accountMap } = require("../server/data/index");
const Transaction = require("../transaction");
const TxIn = require("../transaction/TxIn");
const TxOut = require("../transaction/TxOut");

class Event {
    constructor(address, name, description, creator, creatorName, startDate, endDate) {
        this.address = address;
        this.id = event.length;
        this.name = name;
        this.description = description;
        this.status = 0;   
        this.acceptPeople = new Set();
        this.creator = creator;
        this.creatorName = creatorName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.amountDonated = 0;
        this.timestamp = Date.now();
    }

    getCurrentAmount = (unspentTxOuts) => {
        let balance = 0;

        unspentTxOuts.forEach((unspentTxOut) => {
            if (unspentTxOut.address === this.address && !unspentTxOut.inPool) {
                balance += unspentTxOut.amount;
            }
        });

        return balance;
    }

    checkStatus = () => {
        return this.status;
    }

    endEvent = () => {
        this.status = 2;
    }

    acceptEvent = (publicKey) => {
        if (this.acceptPeople.has(publicKey)) {
            return false;
        }

        this.acceptPeople.add(publicKey);
        if (accountMap.size <= 500) {
            if (this.acceptPeople.size === accountMap.size) this.status = 1;
        } else {
            if (this.acceptPeople.size * 1.0 / accountMap.size >= 0.9) this.status = 1;
        }

        return true;
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

    createDisbursement = (amount, unspentTxOuts) => {
        const { includedTxOuts, remainAmount } = this.findTxOutsForAmount(amount, unspentTxOuts);

        if (includedTxOuts !== null && remainAmount !== null) {
            let txRemain = null;
            if (remainAmount > 0) {
                txRemain = new TxOut(this.address, remainAmount);
            }
            const txIns = includedTxOuts.map((unspentTxOut) => {
                const txIn = new TxIn(unspentTxOut.txOutId, unspentTxOut.txOutIndex, null);
                return txIn;
            });

            const disbursement = new Transaction(this.address, txIns, [txRemain], amount);
            this.signDisbursement(disbursement, unspentTxOuts);
            disbursement.hashData();
            
            return disbursement;
        } else {
            throw new Error('You are not enough money to disburse');
        }
    }

    signDisbursement = (transaction, unspentTxOuts) => {
        if (transaction.senderAddress != this.address) {
            throw new Error('Transaction address is not match.');
        }

        transaction.txIns.forEach((txIn) => {
            if (!verifyUnspentTxOut(txIn.txOutId, this.address, unspentTxOuts)) {
                throw new Error('Transaction address is not match.');
            }

            txIn.signature = this.keyPair.sign(transaction.hashData());
        })
    }
}

module.exports = Event;