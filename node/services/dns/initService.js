const dgram = require('dgram');
/**
* 启动DNS服务，绑定udp端口，创建socket
* 初始化udp socket，区分请求包和响应包
* 重：初始化接受请求的路由器
* @return dnsHandle
* dnsHandle.send
* dnsHandle.cache : set get
*/

async function initSocket(swc, options){
	var socket = dgram.createSocket('udp4');
	/**
	* 一切信息的入口，包括请求包和响应包
	* 在这里分发路由
	*/
	socket.on('message', async (msg, info)=>{
		try{
			var package = await swc.utils.dns.parse(swc, {
				msg : msg,
				info : info
			})
			/**
			* 判断是否请求包 QR
			*/
			if(package.header.qr === '0'){
				//查询包
				await swc.services.dns.routers.resolution(swc, {
					msg : msg,
					package : package,
					info : info
				})
			} else {
				//响应包
				await swc.services.dns.routers.receive(swc, {
					msg : msg,
					package : package,
					info : info,
				})
			}

		}catch(e){
			console.log(e);
		}
	})

	socket.on('error', (err) => {
		console.log(err);
	});

	socket.bind(53);
	console.log(`端口监听：53`);

	return socket;
}

module.exports = async function(swc, _options){
	swc.dnsHandle = {
		/**
		* udp socket
		*/
		socket : await initSocket(swc, {}),
	};

	/**
	* @param packageBuffer 发送包的数据
	* @param address 目标dns服务器地址
	* @param package 发送包的解析数据
	*/
	swc.dnsHandle.send = async function(swc, options){
		/**
		* 1、缓存这个query
		* 2、发送包
		*/
		swc.dnsHandle.socket.send(options.packageBuffer, 53, options.address, (error)=>{
			if(error){
				console.log(error);
			}
		});
	}

	/**
	* 解析缓存
	*/
	swc.dnsHandle.cache = {
		set : async function(swc, options){

		},
		get : async function(swc, options){

		}
	}

	return swc;
}