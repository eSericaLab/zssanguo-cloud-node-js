const AV = require('leanengine')
const Promise = require('bluebird')
    
// 更新canWork,canTrain,workCount,trainCount
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

//更新battleCheckOut, battleOpen
const cityObj = AV.Object.extend('city');
AV.Cloud.define('battleCheckOut', async request => {
    const createQuery = () => {
        return new AV.Query(cityObj).equalTo('isAtWar', true)
    }
    await battleCheckOut(createQuery, (object) => {
        object.fetch({ include: ['owner','invader']}).then(function (city) {
            console.log("开始战场清算");
            var invader = city.get('invader');
            var defdmg = city.get('defdmg');
            var offdmg = city.get('offdmg');
            var cityId = city.get('cityId');
            var battleId = "battle" + cityId;
            var invaderId = "invader" + cityId;
            var defenderId = "defender" + cityId;

            //如果进攻方伤害高,设置owner为进攻方
            if (offdmg > defdmg){
                city.set('owner', invader);
            }
            //伤害清0,isAtWar设置为false,invader清空
            city.set('defdmg', 0);
            city.set('offdmg', 0);
            city.set('isAtWar', false);
            city.unset('invader');

            //TODO call function 重新计算国家可以进攻的地区(按照相邻城市)

            //重置战场排行榜
            AV.Cloud.run('resetLeaderBoard', {
                leaderboardName: battleId,
            }).then(function(data) {
                AV.Cloud.run('resetLeaderBoard', {
                    leaderboardName: invaderId,
                }).then(function(data) {
                    AV.Cloud.run('resetLeaderBoard', {
                        leaderboardName: defenderId,
                    }).then(function(data) {
                        return city.save().then(function(res){
                            console.log("战场结算:城池信息更新完毕" + res);
                        },function(error){
                            console.log("战场结算:城池信息保存失败" + error);
                        });
                    }, function(error) {
                        console.log("防守排行榜重置失败"+error);
                    });
                }, function(error) {
                    console.log("进攻排行榜重置失败"+error);
                });
            }, function(error) {
                console.log("战场排行榜重置失败"+error);
            });
        }, function (error) {
            console.log("城池获取失败" + error);
        });         //end of city fetch

    //TODO return performUpdate的promise
    return new Promise(function(resolve, reject) {
            if (1 == 2){
                reject("error");
            }else{
                resolve("fine");
            }
        });
    });
    console.log('战场清算全部完毕')
});

AV.Cloud.define('battleOpen', async request => {
    const createQuery = () => {
        return new AV.Query(cityObj).notEqualTo('warPending', null)
    };
    await battleOpen(createQuery, (object) => {
        object.fetch({ include: ['owner','warPending']}).then(function (city) {
            //获取待进攻方信息
            var invader = city.get('warPending');
            var invaderName = invader.get('name');
            //获取防守方信息
            var defender = city.get('owner');
            var defenderName = defender.get('name');
            //如果进攻方不是防守方
            if (defenderName !== invaderName){
                //设置invader为进攻方国家object, warPending清空, isAtWar = true
                city.set('invader', invader);
                city.unset('warPending');
                city.set('isAtWar', true);
            }
            return city.save().then(function(res){
                    console.log("战场开启:城池信息更新成功" + res);
                },function(err){
                    console.log("战场开启:城池信息保存失败" + err);
                }
            );
        }, function (error) {
            console.log("城池获取失败" + error);
        });
    //TODO return performUpdate的promise
    return new Promise(function(resolve, reject) {
        if (1 == 2){
            reject("error");
        }else{
            resolve("fine");
        }
    });
});
    console.log('战场开启全部完毕');
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

//批量创建排行榜
AV.Cloud.define('createLeaderBoard', function(request) {
    var i;
    for (i=1; i <=60; i++){
        var leaderboardName = "defender" + i;
        AV.Leaderboard.createLeaderboard({
            statisticName: leaderboardName,
            order: AV.LeaderboardOrder.DESCENDING,
            updateStrategy: AV.LeaderboardUpdateStrategy.SUM,
            versionChangeInterval: AV.LeaderboardVersionChangeInterval.NEVER,
        }, { useMasterKey: true }).then(function(leaderboard) {
            // 创建成功得到 leaderboard 实例
            console.log("排行榜" + leaderboardName+ "创建成功");
        }).catch(console.error);
    }

    for (i=1; i <=60; i++){
        var leaderboardName = "invader" + i;
        AV.Leaderboard.createLeaderboard({
            statisticName: leaderboardName,
            order: AV.LeaderboardOrder.DESCENDING,
            updateStrategy: AV.LeaderboardUpdateStrategy.SUM,
            versionChangeInterval: AV.LeaderboardVersionChangeInterval.NEVER,
        }, { useMasterKey: true }).then(function(leaderboard) {
            // 创建成功得到 leaderboard 实例
            console.log("排行榜" + leaderboardName+ "创建成功");
        }).catch(console.error);
    }
});

//手动重置排行榜
AV.Cloud.define('resetLeaderBoard', function(request) {
    const leaderboardName = request.params.leaderboardName || "battle60"
    var leaderboard = AV.Leaderboard.createWithoutData(leaderboardName);
    leaderboard.reset({ useMasterKey: true })
        .then(function(leaderboard) {
            // 重置成功
            console.log("重置排行榜" + leaderboardName + "成功");
        }).catch(function(error) {
        console.log("重置排行榜" + leaderboardName + "失败" + error);
    });
});




