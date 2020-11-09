import Radius from '../index'
import { RLogger } from '../index'
import http from 'http'

const dictionary = [
  './test/dictionary/dictionary.cisco',
  './test/dictionary/dictionary.dhcp',
  './test/dictionary/dictionary.microsoft',
  './test/dictionary/dictionary.ascend',
  './test/dictionary/dictionary.wispr',
  './test/dictionary/dictionary.mikrotik'
]

const clients = [
  {
    ip: '85.100.121.240',
    requestPort: 3799,
    secret: 'QNbr!34',
    name: 'netoffice'
  }
]

const server = new Radius({
  dictionary: dictionary,
  logging: ['info', 'error', 'debug']
})
server.addClient(...clients)

server.use('Access-Request', (req, res) => {
  res.add('Framed-IP-Addresss', '192.168.1.1')
  res.reject(true)
})

server.use('Accounting-Request', (req, res) => {
  res.accept(true)
})

server.start()

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write('Hello World!')
    res.end()
  })
  .listen(4001)
