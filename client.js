const net = require('net')
const type = require('./type')

let nickName = ''

const client = net.createConnection({
  host: '127.0.0.1',
  port: 3000
})

client.on('connect', () => {
  process.stdout.write('请输入昵称：')
  process.stdin.on('data', data => {
    const msg = data.toString().trim()
    if (!nickName) {
      client.write(JSON.stringify({
        type: type.login,
        nickName: msg
      }))
      return
    }

    let match = /^@(\w+)\s(.+)$/.exec(msg)

    if (match) {
      client.write(JSON.stringify({
        type: type.p2p,
        nickName,
        to: match[1],
        data: match[2]
      }))
      return
    }

    client.write(JSON.stringify({
      type: type.broadcast,
      nickName,
      data: msg
    }))
  })
})

client.on('data', data => {
  const res = JSON.parse(data.toString())
  switch (res.type) {
    case type.login:
      console.log(res.message)
      if (!res.success) {
        process.stdout.write('请输入昵称：')
        return
      }
      nickName = res.nickName
      break
    case type.broadcast:
      if (res.message) {
        console.log(res.message)
        return
      }
      console.log(`${res.nickName}：${res.data}`)
      break
    case type.p2p:
      if (!res.success) {
        console.log(res.message)
        return
      }
      console.log(`${res.nickName}给你发来一条信息：${res.data}`)
      break
    default:
      break
  }
})