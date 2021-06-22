require('dotenv').config();
const axios = require('axios');
const ioClient = require('socket.io-client');
const { senderSockets, peerHttpPortList, sockets, blockchain, pool, event } = require('../server/data');
const MessageTypeEnum = require('../utils/constants').MessageTypeEnum;
const localhost = 'http://localhost:';

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
            console.log("Client message handler");
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


module.exports = {
    /**
     * Sử dụng các sender sockets (server) đã có trước đó bắn thông tin cho tất
     * cả các client (ở đây là socket-client) tương ứng 
     * @param {JSON} message chứa 2 trường thông tin type và data
     */
    broadcast: (message) => {
        senderSockets.forEach(socket => socket.send(message));
    },

    /**
     * 
     * @param {Object} message 
     */
    broadcastToUI: (message) => {
        uiSocketServer.send(message);
    },

    /**
     * Khởi tạo connect tới node chính, sau đó lấy danh sách peer từ node chính,
     * tạo từng cặp socket server-client tới các peer
     * @param {Port của node chính} superNodeHttpPort 
     * @param {Port của node đang muốn connect} httpPort 
     */
    initP2PConnect: async (superNodeHttpPort, httpPort) => {
        const addPeer = async (url, superNodeHttpPort, httpPort) => {
            //* Node chính không connect p2p với chính nó
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
            await axios.get(localhost + superNodeHttpPort + '/peers')
                .then(res => {
                    if (res.status === 200) {
                        for (let i = 0; i < res.data.length; ++i) {
                            if (res.data[i] !== localhost + httpPort && res.data[i] !== localhost + superNodeHttpPort) {
                                addPeer(res.data[i]);
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
                case MessageTypeEnum.UPDATE_BLOCKCHAIN:
                    let newBlockchain = message.data.blockchain;
                    // let newPool = data.pool;

                    //TODO: Xử lý logic
                    // if (isValidChain(newBlockchain)) {
                    //     blockchain = newBlockchain;
                    // }

                    //Bắn yêu cầu client update thông tin mới
                    this.broadcastToUI(UIMessageUpdateBlockchain);

                    break;
                case MessageTypeEnum.UPDATE_TRANSACTION_POOL:
                    let newPool = message.data.pool;

                    // pool = newPool;

                    this.broadcastToUI(UIMessageUpdatePool);
                    break;
                case MessageTypeEnum.UI_ADD_EVENT:
                    let newEvent = message.data.event;

                    // event.set(event.address, newEvent);

                    this.broadcastToUI(UIMessageAddEvent);
                    break;
                case MessageTypeEnum.DISBURSEMENT:
                    let amount = message.data.amount;
                    let currentEvent = message.data.curEvent;
                    let pool = message.data.pool;

                    this.broadcastToUI(UIMessageDisbursement);
                    break;
                case MessageTypeEnum.FORCE_END_EVENT:
                    let currentEvent1 = message.data.curEvent;

                    this.broadcastToUI(UIMessageForceEndEvent);
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