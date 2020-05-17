import Radius from './lib/node-radius';

const server = new Radius();

const clients = [
  { ip: '127.0.0.1', secret: 'secret', name: 'NAS-1' },
  { ip: '192.168.1.2', secret: 'secret', name: 'NAS-2' },
  { ip: '', secret: '', name: 'NAS-2' },
];

server.addClient(...clients);

server.use((req, res) => {
  if (req.data.UserName === '***') {
    console.log(req.code, req.data.UserName, 'ACEPPTED');
    res.accept(true);
  } else {
    console.log(req.code, req.data.UserName, 'rejected');
    res.reject(true);
  }
});

server.start();
