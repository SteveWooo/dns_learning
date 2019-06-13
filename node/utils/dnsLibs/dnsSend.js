/**
* 创建头部信息
*/
function buildHeader(swc, options, bits){
	/**
	* 1、创建序列id(2位)
	*/
	if(!options.package || !options.package.header || !options.package.header.id){
		bits.push(0);
		bits.push(1);
	} else {
		var id = options.package.header.id.split('-');
		bits.push(parseInt(id[0]));
		bits.push(parseInt(id[1]));
	}

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
	if(!options.package || !options.package.header){
		//默认查询包
		bits.push(1);
		bits.push(0);
	} else {
		var header = options.package.header;
		var tag_1 = [0,0,0,0,0,0,0,1], tag_2 = [0,0,0,0,0,0,0,0];
		//0为查询 1为响应
		if(header.qr == 1){
			tag_1[0] = header.qr.toString();
		}

		//是否授权回答
		if(header.aa != undefined && header.aa.length == 1){
			tag_1[5] = header.aa;
		}

		//可截断的
		if(header.tc != undefined && header.tc.length == 1){
			tag_1[6] = header.tc;
		}

		//表示期望递归，请求包中用到，默认1
		if(header.rd == 0){
			tag_1[7] = header.rd;
		}

		//表示服务端可用递归，应答包用到
		if(header.ra == 1){
			tag_2[0] = 1;
		}

		//todo rcode和opcode
		bits.push(parseInt(tag_1.join(''), 2));
		bits.push(parseInt(tag_2.join(''), 2));
	}

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
	if(!options.package || !options.package.header || !options.package.header.answerCount){
		bits.push(0);
		bits.push(0);
	} else {
		bits.push(Math.floor(options.package.header.answerCount / 256));
		bits.push(options.package.header.answerCount % 256);
	}
	

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
	var domain = options.package.question.domain;

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
}

/**
* 构建应答内容，把ip存放在最后四位
* TODO ttl之类的都没写进去 只写了简单的A解析结果
*/
function buildAnswer(swc, options, bits){
	var answer = options.package.answer;
	for(var i=0;i<answer.length;i++){
		if(answer[i].type != 1){
			continue; //先补搞A解析以外的响应
		}

		//修正默认值：
		if(!answer[i].offset){
			answer[i].offset = 12;
		}
		if(!answer[i].type){
			answer[i].type = 1;
		}
		if(!answer[i].class){
			answer[i].class = 1;
		}
		if(!answer[i].ttl){
			answer[i].ttl = 496;
		}
		if(!answer[i].length){
			answer[i].length = 4;
		}

		//偏移量：
		bits.push(192); //(这个指针量我没搞懂怎么回事)
		bits.push(answer[i].offset);

		//解析类型
		bits.push(Math.floor(answer[i].type / 255));
		bits.push(answer[i].type % 255);

		//类型
		bits.push(Math.floor(answer[i].class / 255));
		bits.push(answer[i].class % 255);

		//ttl
		bits.push(Math.floor(answer[i].ttl / (255 * 255 * 255)));
		bits.push(Math.floor(answer[i].ttl / (255 * 255)));
		bits.push(Math.floor(answer[i].ttl / 255));
		bits.push(Math.floor(answer[i].ttl % 255));

		//length
		bits.push(Math.floor(answer[i].length / 255));
		bits.push(answer[i].length % 255);

		//address
		var address = answer[i].address.split('.');
		for(var k=0;k<address.length;k++){
			bits.push(parseInt(address[k]));
		}
	}
	return bits;
}

/**
* 把bits一个一个传到buf中去
*/
function convertBitsToBuffer(swc, options, bits){
	var buf = Buffer.from(bits);
	return buf;
}

exports.buildPackage = async function(swc, options){
	/**
	* 这里要把他们先弄成一个一个bit，放进bits
	* 然后把每一位bit转换成十进制，再通过Buffer.from转换成要发出去的规范十六进制
	*/
	var bits = [];
	bits = buildHeader(swc, options, bits);
	bits = buildQuestion(swc, options, bits);

	/**
	* 看是否有answer
	*/
	if(options.package && options.package.answer){
		bits = buildAnswer(swc, options, bits);
	}

	var buf = convertBitsToBuffer(swc, options, bits);

	return buf;
}