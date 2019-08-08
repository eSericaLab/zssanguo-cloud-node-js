const AV = require('leanengine')
const fs = require('fs')
const path = require('path')

/**
 * 加载 functions 目录下所有的云函数
 */
fs.readdirSync(path.join(__dirname, 'functions')).forEach( file => {
  require(path.join(__dirname, 'functions', file))
})