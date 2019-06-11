async function main(){
	var config = {};
	/**
	* 初始化swc
	*/
	var swc = await require(`${__dirname}/models/swc`)({
		config : config
	});

	/**
	* 主程序控制器入口
	*/
	await require(`${__dirname}/controllers/access`)(swc, {});
}

try{
	main();
}catch(e){
	console.log(e);
}