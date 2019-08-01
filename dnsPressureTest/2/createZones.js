const fs = require('fs');
const crypto = require('crypto');

const _dirs = {
	zone : '/etc/named/zone',
	config : '/etc/named.conf'
}

async function getZoneFile(options){
	var zoneName = options.zoneName;

	var file = 
`${zoneName}.com.	86400	IN	SOA	ns	mail	2019061702 1800 900 604800 86400
${zoneName}.com.	86400	IN	NS	ns.${zoneName}.com.
ns.${zoneName}.com.	518400	IN	A	192.5.6.31

a.${zoneName}.com.	518400	IN	A	111.111.111.111
`
	
	return file;
}

async function getName(options){
	var num = options.num;
	var hash = crypto.createHash('md5').update(num + '').digest('hex');
	return hash;
}

async function main(){
	var dataFile = [];
	var names = [];
	for(var i=0;i<process.argv[2];i++){
		var name = await getName({
			num : i
		});

		names.push(name);

		var file = await getZoneFile({
			zoneName : name
		})

		fs.writeFileSync(_dirs['zone'] + '/test/' + name + '.com.zone', file);
	}
	var nameConf = 
`
options {
	directory "/etc/named";
	pid-file "named.conf";
	allow-query-cache {any;};
	recursion yes;
};
`

	for(var i=0;i<names.length;i++){
		nameConf +=
`
zone "${names[i]}.com." IN {
	type master;
	file "/etc/named/zone/test/${names[i]}.com.zone";
};
`		
		dataFile.push(`${names[i]}.com A`);
	}

	nameConf += 
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
	fs.writeFileSync(_dirs.config, nameConf);
	fs.writeFileSync('./datafile', dataFile.join('\n'));
}

main().then().catch(e=>{
	console.log(e);
})
