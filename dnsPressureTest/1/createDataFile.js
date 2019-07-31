const fs = require('fs');

var datas = [];

for(var i=0;i<process.argv[2]*10000;i++){
    datas.push("www.baidu.com A");
}

fs.writeFileSync('./datafile', datas.join('\n'));


