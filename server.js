'use strict';

var AV = require('leanengine');
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});

// 如果不希望使用 masterKey 权限，可以将下面一行删除
AV.Cloud.useMasterKey();

var app = require('./app');

// 端口一定要从环境变量 `LEANCLOUD_APP_PORT` 中获取。
// LeanEngine 运行时会分配端口并赋值到该变量。
var PORT = parseInt(process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000);
var fs = require("fs");
app.listen(PORT, function (err) {
  console.log('Node应用启动,端口号:', PORT);

  // 注册全局未捕获异常处理器
  process.on('uncaughtException', function(err) {
    var data = err.stack;
    fs.writeFileSync('./server.log', data);
    console.error('Caught exception:', err.stack);
  });
  process.on('unhandledRejection', function(reason, p) {
    var data = reason.stack;
    fs.writeFileSync('./server.log', data);
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason.stack);
  });
});
