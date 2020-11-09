"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
require("../index");
const http_1 = __importDefault(require("http"));
const dictionary = [
    './test/dictionary/dictionary.cisco',
    './test/dictionary/dictionary.dhcp',
    './test/dictionary/dictionary.microsoft',
    './test/dictionary/dictionary.ascend',
    './test/dictionary/dictionary.wispr',
    './test/dictionary/dictionary.mikrotik'
];
const clients = [
    {
        ip: '85.100.121.240',
        requestPort: 3799,
        secret: 'QNbr!34',
        name: 'netoffice'
    }
];
const server = new index_1.default({
    dictionary: dictionary,
    logging: ['info', 'error', 'debug', 'request', 'response']
});
server.addClient(...clients);
server.use('Access-Request', (req, res) => {
    res.add('Framed-IP-Address', '192.168.1.1');
    res.accept(true);
});
server.use('Accounting-Request', (req, res) => {
    res.accept(true);
});
server.start();
http_1.default
    .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Hello World!');
    res.end();
})
    .listen(4001);
//# sourceMappingURL=index.js.map