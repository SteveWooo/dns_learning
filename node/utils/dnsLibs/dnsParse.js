function parseHeader(swc, options){
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

	return header;
}

function parseQuestion(swc, options){
	var question = {
		domain : "",
		type : "",
		class : "",
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

	return question;
}

//todo：根据应答数目跟附加数目来构建answer，现在只是拿了最后一个应答回来。
function parseAnswer(swc, options, result){
	var answer = [];

	//响应结果偏移量
	var resultOffset = 12  //头
			+ result.question.domain.length + 2 //域名
			+ 4 //2个类型;

	for(var i=0;i<result.header.answerCount;i++){
		var ans = {};
		//当前响应结果偏移
		var offset = 0 + resultOffset 

		//偏移指针:C00C
		ans.offset = options.msg[offset + 1];

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

	return answer;
}

/**
* 负责解析请求数据包
* @param.msg DNS请求数据包
*/
module.exports = async function(swc, options){
	var result = {};

	result.header = parseHeader(swc, options, result);
	result.question = parseQuestion(swc, options, result);
	if(result.header.answerCount > 0){
		result.answer = parseAnswer(swc, options, result);
	}

	return result;
}