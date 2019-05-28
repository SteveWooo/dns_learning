const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const dnsLib = require('./dns_lib');

async function main(){
	var buf = dnsLib.buildPackage({});
}
main();


// client.send(buf, 53, '127.0.0.1', (info)=>{
// 	// console.log(info);
// })

// client.on('message', (msg, info)=>{
// 	// console.log(msg.toString());
// })