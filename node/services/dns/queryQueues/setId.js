module.exports = async function(swc, options){
	var queryId;
	//个位数溢出
	if(global.swc.queryQueue.queryId[1] == 255){

		//十位数也溢出
		if(global.swc.queryQueue.queryId[0] == 255){
			global.swc.queryQueue.queryId[0] = 0;
			global.swc.queryQueue.queryId[1] = 1;
		} else {
			global.swc.queryQueue.queryId[0] ++ ;
			global.swc.queryQueue.queryId[1] = 0;
		}

	} else {
		global.swc.queryQueue.queryId[1] ++ ;
	}

	queryId = global.swc.queryQueue.queryId[0] + '-' + global.swc.queryQueue.queryId[1];
	
	return queryId;
}