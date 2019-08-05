const express = require('express');
const app = express();
const fs = require('fs');

function getClientIp(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    ip = ip.substr(ip.lastIndexOf(':')+1,ip.length);
    return ip;  
};

async function startupServer(swc){
    app.get('/', async function (req,res){
    var ip = getClientIp(req);
    console.log('request : ' + ip);
    res.send(
    `
<html>
<head>
</head>
<body>
<script>
    location.href = "https://www.baidu.com"
</script>
</body>
</html>
    `);
    })

    app.listen(80);
}

async function getConfig(){
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
            if(swc.meta.zones == undefined){
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

async function main(){
    var swc = await getConfig();
    if(swc != undefined){
        if(swc.meta.serverType == 'cia'){
            await startupServer(swc);
        }
    }

    console.log('cid end');
}

main();