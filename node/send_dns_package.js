const dgram = require('dgram');
const path = require('path');
const client = dgram.createSocket('udp4');
const dnsSendLib = require(`${path.resolve()}/utils/dnsLibs/dnsSend`);

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
	var buf = await dnsSendLib.buildPackage({}, {
		package : {
			// domain : "hongkong.com"
			// question : {
			// 	domain : "deadfishcrypto.com"
			// },
			// header : {
			// 	qr : 1,
			// 	rd : 1,
			// 	ra : 1,
			// 	answerCount : 1
			// },
			// answer : [{
			// 	address : '9.9.9.9'
			// }]
			question : {
				domain : 'deadfishcrypto.com'
			}
		}
	});

	console.log(buf);
	client.send(buf, 53, '127.0.0.1', (error)=>{
		if(error){
			console.log(error);
		}
	})
}
main();