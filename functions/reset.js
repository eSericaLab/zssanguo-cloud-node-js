const AV = require('leanengine')
const Promise = require('bluebird')

const User = AV.Object.extend('_User');
const cityObj = AV.Object.extend('city');

// canWorkTrainWarReset 重置每日任务状态("可工作","可训练","可战斗")
AV.Cloud.define('canWorkTrainWarReset', async request => {
    console.log("开始执行canWorkTrainWarReset任务");
    const createQuery = () => {
        var canWorkQuery = new AV.Query(User);
        canWorkQuery.equalTo('canWork', false);

        var canTrainQuery = new AV.Query(User);
        canTrainQuery.equalTo('canTrain', false);

        var canWarQuery = new AV.Query(User);
        canWarQuery.equalTo('canWar', false);
        return AV.Query.or(canWorkQuery, canTrainQuery,canWarQuery);
    }
    await canWorkTrainWarReset(createQuery, (object) => {
        console.log('对' + object.getUsername()+ "执行每日任务状态重置");
        object.set('canWork', true);
        object.set('canTrain', true);
        object.set('canWar', true);
        return object.save();
    });
    console.log('每日任务状态重置完毕!')
});
// workTrainCountReset 重置每日工作训练次数
AV.Cloud.define('workTrainCountReset', async request => {
    console.log("开始执行workTrainCountReset任务");
    const createQuery = () => {
        var workCountQuery = new AV.Query(User);
        workCountQuery.notEqualTo('workCount', 0);

        var trainCountQuery = new AV.Query(User);
        trainCountQuery.notEqualTo('trainCount', 0);

        return AV.Query.or(workCountQuery, trainCountQuery);
    }
    await workTrainCountReset(createQuery, (object) => {
        console.log('对' + object.getUsername()+ "执行每日工作训练次数重置");
        object.set('workCount', 0);
        object.set('trainCount', 0);
        return object.save();
    })
    console.log('每日工作训练次数重置完毕!')
})

//battleCheckOutIn整合了battleCheckOut, battleOpen
AV.Cloud.define('battleCheckOutIn', async () => {
    AV.Cloud.run('battleCheckOut').then(function() {
        AV.Cloud.run('battleOpen').then(function(){
            console.log("battleCheckOutIn结算完成")
        }, function(error) {
            console.log("battleOpen运行失败");
            console.log(error);
        });
    }, function(error) {
        console.log("battleCheckOut运行失败");
        console.log(error);
    });
});
//battleCheckOut 战场清算
AV.Cloud.define('battleCheckOut', async request => {
    console.log("开始执行battleCheckOut任务");
    const createQuery = () => {
        return new AV.Query(cityObj).equalTo('isAtWar', true);
    };
    await battleCheckOut(createQuery, (object) => {
        var battleId;
        var invaderId;
        var defenderId;
        var cityName;
        return object.fetch({ include: ['owner','invader']}).then(function (city) {     //修改城市
            var invader = city.get('invader');
            var defdmg = city.get('defdmg');
            var offdmg = city.get('offdmg');
            var cityId = city.get('cityId');
            cityName = city.get("name");
            console.log("开始清算"+cityName+"战场");
            battleId = "battle" + cityId;
            invaderId = "invader" + cityId;
            defenderId = "defender" + cityId;

            //如果进攻方伤害高,设置owner为进攻方
            if (offdmg > defdmg){
                city.set('owner', invader);
            }
            //伤害清0,isAtWar设置为false,invader清空
            city.set('defdmg', 0);
            city.set('offdmg', 0);
            city.set('isAtWar', false);
            city.unset('invader');
            console.log("重置"+cityName+"的进攻伤害,防御伤害,战争状态,所属国家,进攻方");
            return city.save();
        }).then(function(){     //修改排行榜
            console.log(battleId + "排行榜执行更新");
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: battleId,});
        }).then(function(){
            console.log(invaderId + "排行榜执行更新");
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: invaderId,});
        }).then(function(){
            console.log(defenderId + "排行榜执行更新");
            console.log(cityName+'战场清算'+"完毕");
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: defenderId,});
        });
    });
    return new Promise(resolve => {
       resolve('全部战场清算完毕全部完毕');
    });
});
//battleOpen 战场开启
AV.Cloud.define('battleOpen', async request => {
    console.log("开始执行battleOpen任务");
    const createQuery = () => {
        return new AV.Query(cityObj).notEqualTo('warPending', null)
    };
    await battleOpen(createQuery, (object) => {
        return object.fetch({ include: ['owner','warPending']}).then(function (city) {
            console.log("开始开启"+city.get("name")+"战场");
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
                console.log(city.get("name")+"战场的进攻方,战斗待命方,战争状态设置完毕");
            }else{
                return new Promise(reject => {
                    reject('进攻方和防守方重复,停止执行');
                });
            }

            return city.save().then(function(res){
                    console.log(city.get("name")+"战场开启成功");
                },function(err){
                    console.log(city.get("name")+"战场开启失败");
                    console.log(err);
                }
            );
        }, function (error) {
            console.log("战场开启:城池信息获取失败");
            console.log(error);
        });
});
    return new Promise(resolve => {
        resolve('战场开启全部完毕');
    });
});

//批量创建排行榜
AV.Cloud.define('createLeaderBoard', function(request) {
    var i;
    var leaderboardName;
    for (i=1; i <= 60; i++){
        (function(ind) {
                setTimeout(function(){
                    leaderboardName = "defender" + i;
                    AV.Leaderboard.getLeaderboard(leaderboardName).then(function(res){
                        console.log("排行榜已存在,无需新建");
                    },function(err){
                        AV.Leaderboard.createLeaderboard({
                            statisticName: leaderboardName,
                            order: AV.LeaderboardOrder.DESCENDING,
                            updateStrategy: AV.LeaderboardUpdateStrategy.SUM,
                            versionChangeInterval: AV.LeaderboardVersionChangeInterval.NEVER,
                        }, { useMasterKey: true }).then(function(leaderboard) {
                            // 创建成功得到 leaderboard 实例
                            console.log("排行榜" + leaderboardName+ "创建成功");
                        }).catch(console.error);
                    });
                }, 1000 * ind);
        })(i);
    }

    for (i=1; i <= 60; i++){
        (function(ind) {
            setTimeout(function(){
                leaderboardName = "invader" + i;
                AV.Leaderboard.getLeaderboard(leaderboardName).then(function(res){
                    console.log("排行榜已存在,无需新建");
                },function(err){
                    AV.Leaderboard.createLeaderboard({
                        statisticName: leaderboardName,
                        order: AV.LeaderboardOrder.DESCENDING,
                        updateStrategy: AV.LeaderboardUpdateStrategy.SUM,
                        versionChangeInterval: AV.LeaderboardVersionChangeInterval.NEVER,
                    }, { useMasterKey: true }).then(function(leaderboard) {
                        // 创建成功得到 leaderboard 实例
                        console.log("排行榜" + leaderboardName+ "创建成功");
                    }).catch(console.error);
                });
            }, 1000 * ind + 60000);
        })(i);
    }
        for (i=1; i <= 60; i++){
            (function(ind) {
                setTimeout(function(){
                    leaderboardName = "battle" + i;
                    AV.Leaderboard.getLeaderboard(leaderboardName).then(function(res){
                        console.log("排行榜已存在,无需新建");
                    },function(err){
                        AV.Leaderboard.createLeaderboard({
                            statisticName: leaderboardName,
                            order: AV.LeaderboardOrder.DESCENDING,
                            updateStrategy: AV.LeaderboardUpdateStrategy.SUM,
                            versionChangeInterval: AV.LeaderboardVersionChangeInterval.NEVER,
                        }, { useMasterKey: true }).then(function(leaderboard) {
                            // 创建成功得到 leaderboard 实例
                            console.log("排行榜" + leaderboardName+ "创建成功");
                        }).catch(console.error);
                    });
                }, 1000 * ind + 120000);
            })(i);
        }
});
//手动重置排行榜, params.leaderboardName
AV.Cloud.define('resetLeaderBoard', function(request) {
    const leaderboardName = request.params.leaderboardName || "battle60"
    var leaderboard = AV.Leaderboard.createWithoutData(leaderboardName);
    leaderboard.reset({ useMasterKey: true })
        .then(function(leaderboard) {
            // 重置成功
            console.log("重置排行榜" + leaderboardName + "成功");
        }).catch(function(error) {
        console.log("重置排行榜" + leaderboardName + "失败");
        console.log(error);
    });
});

//declarableCities 每天12点和24点 更新魏蜀吴黄巾的可宣战城池
AV.Cloud.define('declarableCities',function(request) {
    console.log("开始执行declarableCities任务");
    //清空所有可宣战城池信息
    var query = new AV.Query('country');
    query.find().then(function (countries) {
        var countryProceeded = 0;
         countries.forEach(function(country){
            country.set('declarables', []);
            countryProceeded++;
            if (countryProceeded === 4){
                AV.Object.saveAll(countries).then(async function(countries){
                    console.log("开始重置各个国家的可宣战城池");

                    var weiguo = AV.Object.createWithoutData('country', '5d2d9dc14415dc00089bd0fe');
                    var shuguo = AV.Object.createWithoutData('country', '5d2d9dbd5dfe8c00082f979f');
                    var wuguo = AV.Object.createWithoutData('country', '5d2d9dc54415dc00089bd114');
                    var huangjin = AV.Object.createWithoutData('country', '5d2d9dc95dfe8c00082f97c8');

                    var weiArray = await AV.Cloud.run("findDeclarables", {countryName: 'weiguo'});
                    var shuArray = await AV.Cloud.run("findDeclarables", {countryName: 'shuguo'});
                    var wuArray = await AV.Cloud.run("findDeclarables", {countryName: 'wuguo'});
                    var huangArray = await AV.Cloud.run("findDeclarables", {countryName: 'huangjin'});

                    weiguo.addUnique('declarables', weiArray);
                    shuguo.addUnique('declarables', shuArray);
                    wuguo.addUnique('declarables', wuArray);
                    huangjin.addUnique('declarables', huangArray);

                    //保存所有
                    Promise.all([weiguo.save(), wuguo.save(), shuguo.save(), huangjin.save()]).then(function(){
                        console.log("各个国家的可宣战城池重置完毕");
                    });
                });
            }
        });
    });
});
//findDeclarables 根据国家,寻找可宣战城池
AV.Cloud.define( "findDeclarables",async function(request){
    var countryCities = [];
    var countryName = request.params.countryName;
    //获取国家obj
    var countryObj;
    var countryQuery = new AV.Query('country');
    countryQuery.equalTo('name', countryName);
    countryCities = await countryQuery.find().then(async function (countries) {
        countryObj = countries[0];

        //通过国家obj获取城池列表
        var cityQuery = new AV.Query('city');
        cityQuery.equalTo('owner', countryObj);
        return await cityQuery.find().then(async function (cities) {
            for (const city of cities) {
                var mapQuery = new AV.Query('map');
                // 查询所有src是city的数据
                mapQuery.equalTo('src', city);
                mapQuery.include(['dest.owner']);
                await mapQuery.find().then(async function(maps){
                    for (const map of maps) {
                        if ((map.get("dest").get("owner").get("name") !== countryName) && (map.get("dest").get("warPending") === undefined)){
                            await countryCities.push(map.get("destCity"));
                        }
                    };
                });
            };
            return new Promise(resolve => {resolve(countryCities);});
        });
    });

    console.log(countryName + " 的可宣战Cities为 : " + countryCities);
    return countryCities;
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
function workTrainCountReset(createQuery, performUpdate, options = {}) {
    var batchLimit = options.batchLimit || 1000;
    var concurrency = options.concurrencyLimit || 3;
    var ignoreErrors = options.ignoreErrors;

    function next() {
        var query = createQuery();

        return query.limit(batchLimit).find().then( results => {
            if (results.length > 0) {
                return Promise.map(results, (object) => {
                    return performUpdate(object).catch( err => {
                        if (ignoreErrors) {
                            console.error('ignored', err);
                        } else {
                            throw err;
                        }
                    })
                }, {concurrency}).then(next);
            }
        })
    }

    return next()
}
function canWorkTrainWarReset(createQuery, performUpdate, options = {}) {
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