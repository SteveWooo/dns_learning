const dgram = require('dgram');
const path = require('path');
const client = dgram.createSocket('udp4');
const dnsLib = require(`${path.resolve()}/dns_lib`);

async function initUdp(){
	client.on('message', (msg, info)=>{
		console.log(msg);
		console.log(`result ip : ${msg[msg.length-4]}.${msg[msg.length-3]}.${msg[msg.length-2]}.${msg[msg.length-1]}`);
	})

	client.on('error', (err) => {
		console.log(err);
	});
}

async function main(){
	await initUdp();
	var buf = dnsLib.buildPackage({
		domain : "hongkong.com"
	});

	console.log(buf);
	client.send(buf, 53, '127.0.0.1', (error)=>{
		if(error){
			console.log(error);
		}
	})
}
main();