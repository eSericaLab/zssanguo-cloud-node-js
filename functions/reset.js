const AV = require('leanengine')
const Promise = require('bluebird')

const User = AV.Object.extend('_User')

AV.Cloud.define('canWorkReset', async request => {
    const canWork = request.params.canWork || true
    const createQuery = () => {
        return new AV.Query(User).notEqualTo('canWork', canWork)
    }
    await canWorkReset(createQuery, (object) => {
        console.log('performUpdate on canWork for', object.id)
        object.set('canWork', canWork)
        return object.save()
    })
    console.log('canWork update finished')
})

AV.Cloud.define('canTrainReset', async request => {
    const canTrain = request.params.canTrain || true
    const createQuery = () => {
        return new AV.Query(User).notEqualTo('canTrain', canTrain)
    }
    await canTrainReset(createQuery, (object) => {
        console.log('performUpdate on canTrain for', object.id)
        object.set('canTrain', canTrain)
        return object.save()
    })
    console.log('canTrain update finished')
})

AV.Cloud.define('workCountReset', async request => {
    const workCount = request.params.workCount || 0
    const createQuery = () => {
        return new AV.Query(User).notEqualTo('workCount', workCount)
    }
    await workCountReset(createQuery, (object) => {
        console.log('performUpdate on workCount for', object.id)
        object.set('workCount', 0)
        return object.save()
    })
    console.log('workCount update finished')
})

AV.Cloud.define('trainCountReset', async request => {
    const trainCount = request.params.trainCount || 0
    const createQuery = () => {
        return new AV.Query(User).notEqualTo('trainCount', trainCount)
    }
    await trainCountReset(createQuery, (object) => {
        console.log('performUpdate on trainCount for', object.id)
        object.set('trainCount', trainCount)
        return object.save()
    })
    console.log('trainCount update finished')
})

//具体的更新方法
function canWorkReset(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }

    return next()
}

function canTrainReset(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }

    return next()
}

function workCountReset(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }

    return next()
}

function trainCountReset(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }

    return next()
}

const city = AV.Object.extend('city')
//战场结算 每小时55分
AV.Cloud.define('battleCheckOut', async request => {
    const createQuery = () => {
        return new AV.Query(city).equalTo('isAtWar', true)
    }
    await battleCheckOut(createQuery, (city) => {
        city.fetch({ include: ['owner'] }).then(function (city) {
            var owner = city.get('owner').get('name')
            var invader = city.get('invader').get('name');
            var defdmg, offdmg = 0;

            //获取防守方伤害
            switch (owner){
                case "weiguo":
                    defdmg = city.get('weidmg')
                    break;
                case "shuguo":
                    defdmg = city.get('shudmg')
                    break;
                case "wuguo":
                    defdmg = city.get('wudmg')
                    break;
                case "huangjin":
                    defdmg = city.get('huangdmg')
                    break;
                default:
                    break;
            }

            //获取进攻方伤害
            switch (invader){
                case "weiguo":
                    offdmg = city.get('weidmg')
                    break;
                case "shuguo":
                    offdmg = city.get('shudmg')
                    break;
                case "wuguo":
                    offdmg = city.get('wudmg')
                    break;
                case "huangjin":
                    offdmg = city.get('huangdmg')
                    break;
                default:
                    break;
            }
            //如果进攻方伤害高,设置owner为进攻方
            if (offdmg > defdmg){
                city.set('owner', invader);
            }
            //所有伤害清0,isAtWar设置为false
            city.set('weidmg', 0);
            city.set('shudmg', 0);
            city.set('wudmg', 0);
            city.set('huangdmg', 0);
            city.set('isAtWar', false)
            //call function 重新计算国家可以进攻的地区(按照相邻城市)
            return city.save()
        }, function (error) {
            console.log("城池获取country失败" + error);
        });
    })
    console.log('战场结算完成')
})

function battleCheckOut(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }
    return next()
}

//战场开启 整点
AV.Cloud.define('battleOpen', async request => {
    const createQuery = () => {
        return new AV.Query(city).notEqualTo('warPending', 0)
    };
    await battleOpen(createQuery, (city) => {
        city.fetch({ include: ['owner'] }).then(function (city) {
            var warPending = city.get('warPending');
            var invader;
            //获取进攻方信息
            switch (warPending){
                case 1:
                    invader = "weiguo";
                    break;
                case 2:
                    invader = "shuguo";
                    break;
                case 3:
                    invader = "wuguo";
                    break;
                case 4:
                    invader = "huangjin";
                    break;
                default:
                    break;
            }
            //获取防守方信息
            var owner = city.get('owner').get('name');
            //如果进攻方不是防守方
            if (owner !== invader){
                //获取进攻方国家
                var query = new AV.Query('country').equalTo('name', invader);
                query.find().then(function (countries) {
                    //设置invader为进攻方国家object, warPending设置为0,isAtWar = true
                    var invader = countries[0];
                    city.set('invader', invader);
                    city.set('warPending', 0);
                    city.set('isAtWar', true);
                    city.save().then(function() {
                        console.log("战场开启成功!");
                    }, function(error) {
                        console.log("战场开启失败!" + error);
                    });
                }, function (error) {
                    console.log("国家不存在" + error);
                });
            }
        }, function (error) {
            console.log("城池获取country失败" + error);
        });
});
    console.log('战场开启完毕')
});

function battleOpen(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000
    var concurrency = options.concurrencyLimit || 3
    var ignoreErrors = options.ignoreErrors

    function next() {
        var query = createQuery()

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
            return Promise.map(results, (object) => {
                return performUpdate(object).catch( err => {
                    if (ignoreErrors) {
                        console.error('ignored', err)
                    } else {
                        throw err
                    }
                })
        }, {concurrency}).then(next)
        }
    })
    }

    return next()
}


