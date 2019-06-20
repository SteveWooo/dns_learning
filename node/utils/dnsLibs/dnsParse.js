function parseHeader(swc, options, result){
	var header = {};

	/**
	* id部分，按照我的格式 x-x
	*/
	header.id = options.msg[0] + "-" + options.msg[1];

	/**
	* flag部分
	*/
	var flag_1 = options.msg[2];
	var flag_2 = options.msg[3];
	flag_1 = flag_1.toString(2);
	flag_2 = flag_2.toString(2);
	//补0 
	for(var i = flag_1.length; i < 8; i++){
		flag_1 = '0' + flag_1;
	}
	for(var i = flag_2.length; i < 8; i++){
		flag_2 = '0' + flag_2;
	}

	header.qr = flag_1[0];
	header.opcode = flag_1[1] + flag_1[2] + flag_1[3] + flag_1[4];
	header.aa = flag_1[5];
	header.tc = flag_1[6];
	header.rd = flag_1[7];
	header.ra = flag_2[0];
	header.rcode = flag_2[4] + flag_2[5] + flag_2[6] + flag_2[7];

	/**
	* 各种数目
	*/
	header.questionCount = options.msg[4]*16 + options.msg[5];
	header.answerCount = options.msg[6] * 16 + options.msg[7];
	header.authorityCount = options.msg[8] * 16 + options.msg[9];
	header.additionalCount = options.msg[10] * 16 + options.msg[11];

	result.header = header;
	return result;
}

function parseQuestion(swc, options, result){
	var question = {
		domain : '',
		type : '',
		class : '',
	}

	for(var i = 12;options.msg[i] !== 0;i += options.msg[i] + 1){
		for(var w = 1;w <= options.msg[i];w ++){
			var char = String.fromCharCode(options.msg[i + w]);
			question.domain += char;
		}
		if(options.msg[i + options.msg[i] + 1] !== 0){
			question.domain += '.';
		}
	}

	var typeBegin = 12 + question.domain.length + 2;
	question.type = options.msg[typeBegin] * 16 + options.msg[typeBegin + 1];
	question.class = options.msg[typeBegin + 2] * 16 + options.msg[typeBegin + 3];

	result.question = question;
	return result;
}

var utils = {
	/**
	* 根据offset 获取响应中的域名
	*/
	getDomain : function(swc, options, result, offset){
		var domain = '';
		var i = offset;
		console.log(`here : ${offset}`);
		while(options.msg[i] != 0){
			var tempDomain = [];
			for(var k=i + 1;k<options.msg[i] + i + 1;k++){
				tempDomain.push(String.fromCharCode(options.msg[k]));
			}
			domain += tempDomain.join('');
			i = i + options.msg[i] + 1;
			if(options.msg[i] != 0){
				domain += '.';
			}
		}

		console.log(domain);
		return domain;
	}
}

function parseAnswer(swc, options, result){
	var answer = [];

	//响应结果偏移量
	var resultOffset = result.resultOffset;
	for(var i=0;i<result.header.answerCount;i++){
		var ans = {};
		//当前响应结果偏移
		var offset = 0 + resultOffset;
		//偏移指针:C00C
		if(options.msg[offset] == 192){
			ans.offset = options.msg[offset + 1];
			ans.domain = utils.getDomain(swc, options, result, ans.offset);
		} else {
			//没遇到过，我也不知道咋整，好像会把整个域名丢进这个位置。
			console.log('没有offset的包出现了！赶紧加高offset');
		}

		//解析类型
		ans.type = options.msg[offset + 2] * 255 + options.msg[offset + 3];
		
		//类型
		ans.class = options.msg[offset + 4] * 255 + options.msg[offset + 5];

		//ttl
		ans.ttl = options.msg[offset + 6] * 255 * 255 * 255 +
				options.msg[offset + 7] * 255 * 255 +
				options.msg[offset + 8] * 255 +
				options.msg[offset + 9];

		//资源记录内容长度
		ans.length = options.msg[offset + 10] * 255 + options.msg[offset + 11];

		//对A解析特殊处理，其他todo
		if(ans.type == 1){
			var address = [];
			for(var k=0;k<ans.length;k++){
				address.push(parseInt(options.msg[offset + 12 + k]));
			}

			ans.address = address.join('.');
		}
		answer.push(ans);

		//上面的所有加起来，再加一个length
		resultOffset += 11 + ans.length;
	}

	result.answer = answer;
	result.resultOffset = resultOffset;
	return result;
}

function parseAuthority(swc, options, result){
	var authority = [];
	var resultOffset = result.resultOffset;

	for(var i=0;i<options.msg.length;i++){
		console.log(`${i} : ${options.msg[i]}, ${String.fromCharCode(options.msg[i])}`);
	}

	return result;
}

/**
* 负责解析请求数据包
* @param.msg DNS请求数据包
*/
module.exports = async function(swc, options){
	var result = {
		resultOffset : 12
	};

	try{
		result = parseHeader(swc, options, result);
		result = parseQuestion(swc, options, result);
		result.resultOffset = 12  //头
				+ result.question.domain.length + 2 //域名
				+ 4 //2个类型;
		// console.log(`offset : ${result.resultOffset}`);
		result = parseAnswer(swc, options, result);
		result = parseAuthority(swc, options, result);
	}catch(e){
		console.log(e)
	}

	// for(var i=0;i<options.msg.length;i++){
	// 	console.log(`${i} : ${options.msg[i]}, ${String.fromCharCode(options.msg[i])}`);
	// }

	console.log(result);

	return result;
}