const { MessageTypeEnum } = require("../../utils/constants");
const { blockchain, pool, event } = require("../data");

module.exports = {
    messageUpdateBlockchain: {
        type: MessageTypeEnum.UPDATE_BLOCKCHAIN,
        data: {
            blockchain: blockchain.chain,
            pool: pool.transactions
        }
    },

    messageUpdateTransactionPool: {
        type: MessageTypeEnum.UPDATE_POOL,
        data: {
            pool: pool.transactions
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
                // event: event
                eventId: eventId,
                publicKey: publicKey
            }
        })
    },

    messageDisbursement: (curEvent) => {
        return ({
            type: MessageTypeEnum.DISBURSEMENT,
            data: {
                // amount: amount,
                // curEvent: curEvent,
                // pool: pool,
                // event: event
                blockchain: blockchain.chain,
                pool: pool.transactions,
                curEvent: curEvent
            }
        })
    },

    messageForceEndEvent: (curEvent) => {
        return ({
            type: MessageTypeEnum.FORCE_END_EVENT,
            data: {
                curEvent: curEvent
            }
        })
    },

    messageNewUser: (account) => {
        return ({
            type: MessageTypeEnum.NEW_USER,
            data: {
                account: account
            }
        })
    },


    UIMessageUpdateBlockchain: {
        type: MessageTypeEnum.UPDATE_BLOCKCHAIN
    },

    UIMessageUpdatePool: {
        type: MessageTypeEnum.UI_UPDATE_BLOCKCHAIN
    },

    UIMessageAddEvent: {
        type: MessageTypeEnum.UI_ADD_EVENT
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

