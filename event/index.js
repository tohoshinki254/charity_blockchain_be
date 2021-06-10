import { event, numUser } from "../server/data/index";

class Event {
    constructor(address, name, description, creator, startDate, endDate) {
        this.address = address;
        this.id = event.length;
        this.name = name;
        this.description = description;
        this.status = false;
        this.numAccepted = 0;
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

    acceptEvent = () => {
        this.numAccepted++;
        if (numUser <= 500) {
            if (this.numAccepted === 500) this.status = true;
        } else {
            if (this.numAccepted * 1.0 / numUser >= 0.9) this.status = true;
        }
    }
}

export default Event;