const { MessageTypeEnum } = require("../../utils/constants");
const { blockchain, pool, event } = require("../data");
// const MessageTypeEnum = {
//     TEST: -1,
//     CREATE_CONNECTION: 0,
//     UPDATE_ALL: 1,
//     UPDATE_TRANSACTION_POOL: 2,
//     ADD_EVENT: 3,
//     ACCEPT_EVENT: 4,
//     DISBURSEMENT: 5,
//     FORCE_END_EVENT: 6,
//     NEW_USER: 7,
    
//     UI_UPDATE_ALL: 1001,
//     UI_UPDATE_POOL: 1002,
//     UI_ADD_EVENT: 1003,
//     UI_ACCEPT_EVENT: 1004,
//     UI_DISBURSEMENT: 1005,
//     UI_FORCE_END_EVENT: 1006,
// }
module.exports = {
    messageUpdateBlockchain: {
        type: MessageTypeEnum.UPDATE_ALL,
        data: {
            blockchain: blockchain.chain,
            pool: pool.transactions
        }
    },

    messageUpdateTransactionPool: {
        type: MessageTypeEnum.UPDATE_TRANSACTION_POOL,
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
        type: MessageTypeEnum.UI_UPDATE_ALL
    },

    UIMessageUpdatePool: {
        type: MessageTypeEnum.UI_UPDATE_POOL
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

