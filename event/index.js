const { event, numUser } = require("../server/data/index");

class Event {
    constructor(address, name, description, creator, startDate, endDate) {
        this.address = address;
        this.id = event.length;
        this.name = name;
        this.description = description;
        this.status = false;
        this.acceptPeople = new Set();
        this.creator = creator;
        this.startDate = startDate;
        this.endDate = endDate;
        this.amountDonated = 0;
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

    acceptEvent = (publicKey) => {
        if (this.acceptPeople.has(publicKey)) {
            return false;
        }

        this.acceptPeople.add(publicKey);
        if (numUser <= 500) {
            if (this.acceptPeople.size === numUser) this.status = true;
        } else {
            if (this.acceptPeople.size * 1.0 / numUser >= 0.9) this.status = true;
        }

        return true;
    }
}

module.exports = Event;