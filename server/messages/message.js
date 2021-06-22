const { MessageTypeEnum } = require("../../utils/constants");
const { blockchain, pool, event } = require("../data");

module.exports = {
    messageUpdateBlockchain: {
        type: MessageTypeEnum.UPDATE_BLOCKCHAIN,
        data: {
            blockchain: blockchain,
            pool: pool
        }
    },

    messageUpdateTransactionPool: {
        type: MessageTypeEnum.UPDATE_ALL,
        data: {
            pool: pool
        }
    },

    messageAddEvents: (event) => {
        return ({
            type: MessageTypeEnum.ADD_EVENT,
            data: {
                event: event
            }
        })
    },

    messageAcceptEvents: (eventId, publicKey) => {
        return ({
            type: MessageTypeEnum.ACCEPT_EVENT,
            data: {
                event: event
                // eventId: eventId,
                // publicKey: publicKey
            }
        })
    },

    messageDisbursement: (amount, curEvent) => {
        return ({
            type: MessageTypeEnum.DISBURSEMENT,
            data: {
                // amount: amount,
                // curEvent: curEvent,
                pool: pool,
                event: event
            }
        })
    },

    messageForceEndEvent: (curEvent) => {
        return ({
            type: MessageTypeEnum.FORCE_END_EVENT,
            data: {
                event: event
            }
        })
    },


    UIMessageUpdateBlockchain: {
        type: MessageTypeEnum.UPDATE_BLOCKCHAIN
    },

    UIMessageUpdatePool: {
        type: MessageTypeEnum.UI_UPDATE_BLOCKCHAIN
    },

    UIMessageAcceptEvents: {
        type: MessageTypeEnum.UI_ACCEPT_EVENT,
    },

    UIMessageDisbursement: {
        type: MessageTypeEnum.UI_DISBURSEMENT
    },
    UIMessageForceEndEvent: {
        type: MessageTypeEnum.FORCE_END_EVENT,
    },

}

