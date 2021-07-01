require('dotenv').config();
const axios = require('axios');
const ioClient = require('socket.io-client');
const { senderSockets, peerHttpPortList, sockets, blockchain, pool, event, accountMap } = require('../server/data');
const MessageTypeEnum = require('../utils/constants').MessageTypeEnum;
const localhost = 'http://localhost:';
const { isValidChain } = require('../utils/chainUtils')
const { UIMessageAcceptEvents,
    UIMessageAddEvent,
    UIMessageDisbursement,
    UIMessageForceEndEvent,
    UIMessageUpdateBlockchain,
    UIMessageUpdatePool } = require('../server/messages/message')


//* Socket server dùng cho kết nối với client
var httpUIServer;
var uiSocketServer;

/**
 * 
 * @param {Object} message 
 */
 const broadcastToUI = (message) => {
    uiSocketServer.send(message);
}

const doA = () => {
    httpUIServer = require('http').createServer();
    uiSocketServer = require('socket.io')(httpUIServer, {
        cors: { origin: "*" },
        setTimeout: 10000
    })

    uiSocketServer.on('connection', socket => {
        console.log('A client UI has accessed to this UI socket!!!')
    })

    httpUIServer.listen(process.env.UI_SOCKET_PORT, () => console.log('App is listening UI socket port on: ' + process.env.UI_SOCKET_PORT))
}



/**
 * Dùng để xử lý các message nhận được từ socket client gửi lên
 * Message là một string JSON với cấu trúc
 * {
 *      type: Lấy từ enum
 *      data: Tùy ý
 * }
 * @param {Socket} ws 
 */
const initSocketServerMessageHandler = ws => {
    ws.on('message', message => {
        try {
            console.log("Server message handler");
            console.log(message);

            switch (message.type) {
                case MessageTypeEnum.CREATE_CONNECTION:
                    console.log(message.data.port);

                    const newSocket = ioClient(localhost + message.data.port, {
                        setTimeout: 10000
                    });

                    senderSockets.push(newSocket);
                    peerHttpPortList.push(localhost + message.data.httpPort)

                    // write(newSocket, queryChainLengthMsg());
                    break;
                case MessageTypeEnum.TEST:
                    console.log("Test1 sent");
                    break;
                case MessageTypeEnum.UPDATE_ALL:
                    let newBlockchain = message.data.blockchain;
                    let newPool = message.data.pool;

                    // Xử lý logic
                    if (isValidChain(newBlockchain)) {
                        blockchain.chain = newBlockchain;
                        pool.transactions = newPool;
                    }

                    //Bắn yêu cầu client update thông tin mới
                    broadcastToUI(UIMessageUpdateBlockchain);

                    break;
                case MessageTypeEnum.UPDATE_TRANSACTION_POOL:
                    let newPool1 = message.data.pool;

                    pool.transactions = newPool1;

                    broadcastToUI(UIMessageUpdatePool);
                    break;
                case MessageTypeEnum.ADD_EVENT:
                    let newEvent = message.data.event;

                    event.set(newEvent.address, newEvent);
                    // event = message.data.event;

                    broadcastToUI(UIMessageAddEvent);
                    break;
                case MessageTypeEnum.ACCEPT_EVENT:
                    let eventId = message.data.eventId;
                    let publicKey = message.data.publicKey;

                    let thisEvent = event.get(eventId);
                    thisEvent.acceptEvent(publicKey);

                    broadcastToUI(UIMessageAcceptEvents);
                    break;

                case MessageTypeEnum.DISBURSEMENT:

                    blockchain.chain = message.data.blockchain;
                    pool.transactions = message.data.pool;
                    event.set(message.data.curEvent.address, message.data.curEvent);
                    // pool = message.data.pool;
                    // event = message.data.event;

                    broadcastToUI(UIMessageDisbursement);
                    break;
                case MessageTypeEnum.FORCE_END_EVENT:
                    // let currentEvent1 = message.data.curEvent;
                    event.set(message.data.curEvent.address, message.data.curEvent);

                    broadcastToUI(UIMessageForceEndEvent(message.data.curEvent.address));
                    break;
                case MessageTypeEnum.NEW_USER:
                    let newUser = message.data.account;
                    accountMap.set(newUser.address, newUser);
                    // this.broadcastToUI({
                    //     type: MessageTypeEnum.UI_
                    // })
                    break;
            }
        }
        catch (e) {
            console.log(e);
        }
    })
};

const initErrorHandler = ws => {
    const closeConnection = closingWebSocket => {
        console.log('Connection failed to peer: ' + closingWebSocket.url);
        sockets.splice(sockets.indexOf(closingWebSocket), 1);
    }

    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}




/**
 * Sử dụng các sender sockets (server) đã có trước đó bắn thông tin cho tất
 * cả các client (ở đây là socket-client) tương ứng 
 * @param {JSON} message chứa 2 trường thông tin type và data
 */
const broadcast = (message, data) => {
    console.log("broadcasting");
    console.log(message);
    senderSockets.forEach(socket => socket.send(message));
    broadcastToUI({
        type: message.type + 1000,
        data: data
    });
}


module.exports = {
    doA,
    broadcastToUI,
    broadcast,

    /**
     * Khởi tạo connect tới node chính, sau đó lấy danh sách peer từ node chính,
     * tạo từng cặp socket server-client tới các peer
     * @param {Port của node chính} superNodeHttpPort 
     * @param {Port của node đang muốn connect} httpPort 
     */
    initP2PConnect: async (superNodeHttpPort, httpPort) => {
        const addPeer = async (url, superNodeHttpPort, httpPort) => {
            //* Node chính không connect p2p với chính nó
            console.log("url", url)
            
            if (superNodeHttpPort === httpPort) {
                return;
            }

            await axios.post(url + '/addPeer', {
                peer: process.env.P2P_PORT,
                httpPort: process.env.PORT
            }).then(res => {
                if (res.status === 200) {
                    console.log("Init connection to peer: Success")
                }
                else {
                    console.log("Fail to add peers")
                }
            }).catch(error => {
                console.log(error);
            });
        };

        const getPeerFromSuperNode = async (superNodeHttpPort) => {
            console.log("get peer from super node")
            await axios.get(localhost + superNodeHttpPort + '/peers')
                .then(res => {
                    console.log(res.data)
                    if (res.status === 200) {
                        
                        for (let i = 0; i < res.data.length; ++i) {
                            if (res.data[i] !== localhost + httpPort && res.data[i] !== localhost + superNodeHttpPort) {
                                console.log(res.data[i]);
                                addPeer(res.data[i], superNodeHttpPort, httpPort);
                            }
                        }
                    }
                    else {
                        console.log("Fail to connect to peers");
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }


        await addPeer(localhost + superNodeHttpPort, superNodeHttpPort, httpPort);
        await getPeerFromSuperNode(superNodeHttpPort);
    },

    /**
     * Kết nối tới một node peer
     * - Tạo 1 socket client (A) nối tới node có địa chỉ p2p là newPeer
     * - Sau khi nối xong, gửi 1 packet yêu cầu node có địa chỉ p2p tạo 1 socket
     * client nối tới địa chỉ p2p của node này
     * - Lưu lại A vào danh sách senderSockets, dùng để broadcast
     * 
     * @param {} newPeer p2p port của server socket ứng với node cần kết nối
     * @param {} httpPort http port của node cần kết nối
     */
    connectToPeers: (newPeer, httpPort) => {
        const newSocket = ioClient(localhost + newPeer);


        newSocket.on('message', data => {
            this.initSocketClientMessageHandler(data);
        })

        console.log("New socket created, prepare for init connection");


        let data = {
            type: MessageTypeEnum.CREATE_CONNECTION,
            data: {
                port: process.env.P2P_PORT,
                httpPort: process.env.PORT
            }
        }
        console.log(data);
        newSocket.send(data);

        senderSockets.push(newSocket);
        peerHttpPortList.push(localhost + httpPort);
    },

    /**
        * Dùng để xử lý các message nhận được từ socket server gửi về
        * Message là một object với cấu trúc
        * {
        *      "type": Lấy từ enum
        *      "data": Tùy ý, ưu tiên một số hoặc json
        * }
    */
    initSocketClientMessageHandler: message => {
        console.log("Client message handler");
        console.log(message);

        try {
            switch (message.type) {
                case MessageTypeEnum.TEST:
                    console.log("Test2 sent");
                    break;

            }
        }
        catch (e) {
            console.log(e.message);
        }

    },

    initConnection: (ws) => {
        if (sockets.find(t => t === ws) === undefined) {
            sockets.push(ws);
        }
        else {
            console.log("Duplicate websockets");
        }

        console.log("Sockets length: " + sockets.length);

        initSocketServerMessageHandler(ws);
        initErrorHandler(ws);

        // setTimeout(() => {
        //     this.broadcast(queryTransactionPoolMsg());
        // }, 500)
    }
}