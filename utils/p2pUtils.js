const axios = require('axios');
const ioClient = require('socket.io-client');
const { senderSockets, peerHttpPortList, sockets } = require('../server/data');
const MessageTypeEnum = require('./messageTypeEnum')

module.exports = {
    /**
     * Sử dụng các sender sockets (server) đã có trước đó bắn thông tin cho tất
     * cả các client (ở đây là socket-client) tương ứng 
     * @param {JSON} message 
     */
    broadcast: (message) => {
        senderSockets.forEach(socket => write(socket, message));
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
                peer: p2pPort,
                httpPort: httpPort
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
            await axios.get('http://localhost:' + superNodeHttpPort + '/peers')
                .then(res => {
                    if (res.status === 200) {
                        for (let i = 0; i < res.data.length; ++i) {
                            if (res.data[i] !== 'http://localhost:' + httpPort && res.data[i] !== 'http://localhost:' + superNodeHttpPort) {
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


        await addPeer('http://localhost:' + superNodeHttpPort, superNodeHttpPort, httpPort);
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
        const newSocket = ioClient("http://localhost:" + newPeer);


        newSocket.on('message', data => {
            this.initSocketClientMessageHandler(data);
        })

        console.log("New socket created, prepare for init connection");

        newSocket.send({
            type: MessageTypeEnum.CREATE_CONNECTION,
            data: {
                port: process.env.P2P_PORT,
                httpPort: process.env.HTTP_PORT
            }
        });

        senderSockets.push(newSocket);
        peerHttpPortList.push("http://localhost:" + httpPort);
    },

    /**
        * Dùng để xử lý các message nhận được từ socket server gửi về
        * Message là một string JSON với cấu trúc
        * {
        *      "type": Lấy từ enum
        *      "data": Tùy ý, ưu tiên một số hoặc json
        * }
    */
    initSocketClientMessageHandler: message => {
        let p = JSONToObject(message);
        // let pData = JSONToObject(p.data);

        //! Xử lý data tại đây
        switch (p.type) {

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

        this.initSocketServerMessageHandler(ws);
        this.initErrorHandler(ws);

        // setTimeout(() => {
        //     this.broadcast(queryTransactionPoolMsg());
        // }, 500)
    },

    /**
     * Dùng để xử lý các message nhận được từ socket client gửi lên
     * Message là một string JSON với cấu trúc
     * {
     *      type: Lấy từ enum
     *      data: Tùy ý
     * }
     * @param {Socket} ws 
     */
    initSocketServerMessageHandler: ws => {
        ws.on('message', data => {
            try {
                let message = JSONToObject(data);

                switch (message.type) {
                    case MessageTypeEnum.CREATE_CONNECTION:
                        console.log(message.data.port);

                        const newSocket = ioClient("http://localhost:" + message.data.port, {
                            setTimeout: 10000
                        });

                        senderSockets.push(newSocket);
                        peerHttpPortList.push("http://localhost:" + message.data.httpPort)

                        // write(newSocket, queryChainLengthMsg());
                        break;
                }
            }
            catch (e) {
                console.log(e);
            }
        })
    },

    initErrorHandler: ws => {
        const closeConnection = closingWebSocket => {
            console.log('Connection failed to peer: ' + closingWebSocket.url);
            sockets.splice(sockets.indexOf(closingWebSocket), 1);
        }

        ws.on('close', () => closeConnection(ws));
        ws.on('error', () => closeConnection(ws));
    }
}