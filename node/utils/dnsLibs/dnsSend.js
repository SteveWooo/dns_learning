/**
* 创建头部信息
*/
function buildHeader(swc, options, bits){
	/**
	* 1、创建序列id(2位)
	*/
	bits.push(0);
	bits.push(1);

	/**
	* 2、创建tag(2位)
	* 这里转换很恶心,要弄成：|0 0000 0 0 1|0 000 0000|，因此，这两个bit的ascii码就是（1，0）
	* 上面对应：
	
		QR（1bit）	查询/响应标志，0为查询，1为响应
		opcode（4bit）	0表示标准查询，1表示反向查询，2表示服务器状态请求
		AA（1bit）	表示授权回答
		TC（1bit）	表示可截断的
		RD（1bit）	表示期望递归
		RA（1bit）	表示可用递归
		zero(3bit)	保留
		rcode（4bit）	表示返回码，0表示没有差错，3表示名字差错，2表示服务器错误（Server Failure）

	*/
	bits.push(1);
	bits.push(0);

	/**
	* 3、询问数目
	* 查一个域名，所以丢一个1进去
	*/
	bits.push(0);
	bits.push(1);

	/**
	* 4:应答数目
	* 5:授权数目
	* 6:附加数目
	* 这几个全是0，所以丢6个位的0进去
	*/
	bits.push(0);
	bits.push(0);

	bits.push(0);
	bits.push(0);
	
	bits.push(0);
	bits.push(0);
	return bits;
}

/**
* 塞域名进去
*/
function buildQuestion(swc, options, bits){
	var domain = options.domain;

	domain = domain.split('.');
	for(var i=0;i<domain.length;i++){
		bits.push(domain[i].length); //长度计数丢进去咯

		/**
		* 然后把每个字符串转换成ascii码再丢进去
		*/
		for(var k=0;k<domain[i].length;k++){
			bits.push(domain[i][k].charCodeAt());
		}
	}
	//别忘了加个0结束；
	bits.push(0);

	/**
	* type 1代表A解析
	*/
	bits.push(0);
	bits.push(1);

	/**
	* class
	*/
	bits.push(0);
	bits.push(1);

	return bits;

	return bits;
}

/**
* 把bits转换成ascii字符，一个一个传到buf中去
*/
function convertBitsToBuffer(swc, options, bits){
	var buf = Buffer.alloc(bits.length);
	for(var i=0;i<bits.length;i++){
		var char = String.fromCharCode(bits[i]);
		buf.write(char, i); //或者用concat(buf1, buf2)合起来新的buf；
	}
	return buf;
}

exports.buildPackage = async function(swc, options){
	/**
	* 因为Buffer.write是要传一个字符串，然后他再转换成ascii码，然后再变成二进制码发出去
	* 所以这里要把他们先弄成一个一个bit，放进bits
	* bits中每个bit代表期望放进最终buffer中的每个bit 的ascii码。
	* 例如你想弄一位 | 0000 1000 | 进去buffer中，那么就 bits.push(8);
	*/
	var bits = [];
	bits = buildHeader(swc, options, bits);
	bits = buildQuestion(swc, options, bits);

	var buf = convertBitsToBuffer(swc, options, bits);

	return buf;
}