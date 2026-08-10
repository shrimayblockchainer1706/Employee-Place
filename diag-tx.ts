import { WebSocket } from 'ws';

const WS_URL = 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';
const TARGET = 'fedc2b13aab47c0a625eff4430caf5db618889ea85fec31934b1ada8cbc3c3da';

const ws = new WebSocket(WS_URL);
const log = (m: string) => console.log('[' + new Date().toISOString() + '] ' + m);
const timer = setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 45000);
let started = false;

const start = () => {
  ws.send(JSON.stringify({
    id: 1,
    type: 'start',
    payload: {
      query: `
        query T($addr: String!) {
          transactions(where: { contractAddress: { eq: $addr } }) {
            edges { node { id transactionId finalizedAt cwStatus } }
          }
        }
      `,
      variables: { addr: TARGET },
    },
  }));
};

ws.on('open', () => {
  log('WS open; sending connection_init');
  ws.send(JSON.stringify({ type: 'connection_init', payload: {} }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'connection_ack') {
    log('ACK received; starting query');
    start();
  } else if (msg.type === 'data' || msg.type === 'next') {
    log('QUERY_RESULT: ' + JSON.stringify(msg.payload));
  } else {
    log('WS_MSG: ' + data.toString().slice(0, 400));
  }
});

ws.on('error', (e) => { log('WS_ERROR: ' + e.message); clearTimeout(timer); process.exit(1); });
ws.on('close', () => { clearTimeout(timer); process.exit(0); });