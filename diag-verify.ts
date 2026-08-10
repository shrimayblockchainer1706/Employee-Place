const GQL = 'https://indexer.preview.midnight.network/api/v4/graphql';
const CONTRACT = 'fedc2b13aab47c0a625eff4430caf5db618889ea85fec31934b1ada8cbc3c3da';
const TX_HASH = '7dca31aea781fdaa3f3eda7dd54e84e32ca00b1b956487336d3f075ced8a296c';

async function q(query, variables, label) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  console.log('--- ' + label + ' (HTTP ' + res.status + ') ---');
  console.log((await res.text()).slice(0, 4000));
  console.log('');
}

// Contract state + authority with valid subfield selections.
await q(
  'query Q($a: String!) { contract(address: $a) { address state maintenanceAuthority { committee { kind } threshold counter } } }',
  { a: CONTRACT },
  'contract state (fixed)',
);

// decode the state hex -> ascii printable fragments
const contractRes = await fetch(GQL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query Q($a: String!) { contract(address: $a) { state } }',
    variables: { a: CONTRACT },
  }),
});
const j = await contractRes.json();
const hex = j.data.contract.state;
console.log('STATE_LEN=' + (hex.length / 2));
const ascii = [];
for (let i = 0; i + 1 < hex.length; i += 2) {
  const c = parseInt(hex.slice(i, i + 2), 16);
  ascii.push(c >= 32 && c < 127 ? String.fromCharCode(c) : '.');
}
console.log('PRINTABLE: ' + ascii.join(''));

// tx by hash with block height + actions
await q(
  'query Q($h: HexEncoded!) { transactions(offset: { hash: $h }) { id hash block { height } contractActions { address } } }',
  { h: TX_HASH },
  'tx by hash',
);