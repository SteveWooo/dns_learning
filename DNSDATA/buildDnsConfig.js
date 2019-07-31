const fs = require('fs');

async function init(){
    var swc = {};
    // 提取元数据
    var metaData = fs.readFileSync('/meta.js').toString();

    try {
        metaData = JSON.parse(metaData);
        swc.meta = {};
        for(var i in metaData){
            var t = i.split('.');
            if(t[0] == 'dns'){
                swc.meta[t[1]] = metaData[i]; 
            }
        }

        //递归服务器不需要配置zone
        if(swc.meta.serverType == 'recursive'){
        	return swc;
        }

        if(swc.meta.serverType == 'authoritative'){
        	//权威服务器必须传IP
	        if(swc.meta.ip == undefined){
	        	console.log('缺少ip meta配置');
	            return undefined;
	        }

	        // 获取本机所需管理的zone
	        if(swc.zones == undefined){
	        	var config = require('/etc/named/zone/zoneFiles/config.json');
		        for(var i=0;i<config.length;i++){
		        	for(var s=0;s<config[i].servers.length;s++){
		        		if(config[i].servers[s].ip == swc.meta.ip) {
		        			swc.meta.zones = config[i].servers[s].zones
		        		}
		        	}
		        }
	        }

	        if(swc.meta.zones == undefined){

	        	return undefined;
	        }

	        return swc;
        }

        //no match
        return undefined;
    }catch(e){
        console.log(e);
    }
}

async function buildRecursiveConf(swc){
	var namedConf = 
`
options {
	directory "/etc/named";
	pid-file "named.conf";
	allow-query-cache {any;};
	recursion yes;
};

zone "." IN {
	type hint;
	file "zone/zoneFiles/root.ca";
};
`
	return namedConf;
}

async function buildAuthoritativeConf(swc){
	var namedConf = 
`
options {
	directory "/etc/named";
	pid-file "named.conf";
	#blackhole {173.245.59.131;};
	recursion no;
};
`
	var zones = swc.meta.zones;
	zones = zones.split(',');

	for(var i=0;i<zones.length;i++){
		var zone = zones[i];
		zone = zone.split('.');
		var zoneConf = '';
		//tld
		if(zone.length == 1 && zone[0] != 'root'){
			zoneConf += 
`
zone "${zone[0]}." IN {
	type master;
	file "zone/zoneFiles/tlds/${zone[0]}.zone";
};
`
		}

		if(zone.length == 1 && zone[0] == 'root'){
			zoneConf += 
`
zone "." IN {
	type master;
	file "zone/zoneFiles/root.zone";
};
`
		}

		//auth
		if(zone.length == 2){
			zoneConf += 
`
zone "${[zone[0], zone[1]].join('.')}." IN {
	type master;
	file "zone/zoneFiles/auth/${[zone[0], zone[1]].join('.')}.zone";
};
`
		}

		namedConf += zoneConf;
	}
	return namedConf;
}

async function buildNamedConf(swc){
	var namedConf = '';
	if(swc.meta.serverType == 'authoritative'){
		namedConf = await buildAuthoritativeConf(swc);
	};

	if(swc.meta.serverType == 'recursive'){
		namedConf = await buildRecursiveConf(swc);
	}

	namedConf += 
`
logging {
    channel query_log {
        file "/var/named/log/query.log" versions 3 size 20m;
        print-time yes;
        print-category yes;
        severity dynamic;
    };
    category queries {
        query_log;
    };
};
`

	fs.writeFileSync('/etc/named.conf', namedConf);
}

/**
* 权威服务器至少需要的参数：
* serverType : authoritative
* zone : zone
*
* 递归服务器至少需要的参数
* serverType : recursive
*/
async function main(){
    try{
        var swc = await init();
        if(!swc){
        	return ;
        }
        // entry
       	await buildNamedConf(swc);

       	//重启named
       	require('child_process').exec('/usr/sbin/name', ()=>{
       		console.log('重启named');
       	})
    }catch(e){
        console.log(e);
    }
}

main().then().catch(e=>{
	console.log(e);
});