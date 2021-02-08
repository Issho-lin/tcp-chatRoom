const net = require('net')
const type = require('./type')

const server = net.createServer()

const users = []

server.on('connection', clientSocket => {
  clientSocket.on('data', data => {
    const res = JSON.parse(data.toString())
    console.log(res)
    switch (res.type) {
      case type.login:
        const { nickName } = res
        if (users.find((item => item.nickName === nickName))) {
          clientSocket.write(JSON.stringify({
            type: type.login,
            success: false,
            message: '昵称已存在',
          }))
          return
        }
        clientSocket.nickName = nickName
        users.forEach(socket => {
          socket.write(JSON.stringify({
            type: type.broadcast,
            success: true,
            message: `${nickName}已上线，当前在线人数：${users.length + 1}`
          }))
        })
        users.push(clientSocket)
        clientSocket.write(JSON.stringify({
          type: type.login,
          success: true,
          nickName: nickName,
          message: `登录成功，当前在线人数：${users.length}`
        }))
        break
      case type.broadcast:
        users.forEach(socket => {
          if (socket.nickName !== clientSocket.nickName) {
            socket.write(JSON.stringify({
              ...res,
              success: true
            }))
          }
        })
        break
      case type.p2p:
        let socket = users.find(item => item.nickName === res.to)
        if (!socket) {
          clientSocket.write(JSON.stringify({
            type: type.p2p,
            success: false,
            message: '该用户不存在'
          }))
          return
        }
        socket.write(JSON.stringify({
          ...res,
          success: true
        }))
        break
      default:
        break
    }
  })

  clientSocket.on('end', () => {
    const { nickName } = clientSocket
    const index = users.findIndex(item => item.nickName === nickName)
    if (index !== -1) {
      users.splice(index, 1)
      users.forEach(socket => {
        socket.write(JSON.stringify({
          type: type.broadcast,
          success: true,
          message: `${nickName}已离线，当前在线人数：${users.length}`
        }))
      })
    }
  })
})

server.listen(3000, () => console.log('server running ...'))