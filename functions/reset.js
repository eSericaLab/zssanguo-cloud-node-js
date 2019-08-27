const AV = require('leanengine')
const Promise = require('bluebird')
    
// canWorkTrainWarReset整合了canWorkReset，canTrainReset，canWarReset
const User = AV.Object.extend('_User')
AV.Cloud.define('canWorkTrainWarReset', async request => {
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
        console.log('reset canWorkTrainWar to true for', object.id)
        object.set('canWork', true);
        object.set('canTrain', true);
        object.set('canWar', true);
        return object.save();
    })
    console.log('canWorkTrainWar reset completed')
})
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

// workTrainCountReset整合了workCountReset，trainCountReset
AV.Cloud.define('workTrainCountReset', async request => {
    const createQuery = () => {
        var workCountQuery = new AV.Query(User);
        workCountQuery.notEqualTo('workCount', 0);

        var trainCountQuery = new AV.Query(User);
        trainCountQuery.notEqualTo('trainCount', 0);

        return AV.Query.or(workCountQuery, trainCountQuery);
    }
    await workTrainCountReset(createQuery, (object) => {
        console.log('reset workTrainCount to 0 for', object.id)
        object.set('workCount', 0);
        object.set('trainCount', 0);
        return object.save();
    })
    console.log('workTrainCount reset completed')
})
function workTrainCountReset(createQuery, performUpdate, options = {}) {
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

//battleCheckOutIn整合了battleCheckOut, battleOpen
const cityObj = AV.Object.extend('city');
AV.Cloud.define('battleCheckOutIn', async request => {
    AV.Cloud.run('battleCheckOut').then(function(data) {
        AV.Cloud.run('battleOpen').then(function(data){
            console.log("battleCheckOutIn结算完成")
        }, function(error) {
            console.log("battleOpen运行失败");
        });
    }, function(error) {
        console.log("battleCheckOut运行失败");
    });
});
//更新battleCheckOut, battleOpen
AV.Cloud.define('battleCheckOut', async request => {
    const createQuery = () => {
        return new AV.Query(cityObj).equalTo('isAtWar', true)
    }
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
            return city.save();
        }).then(function(){     //修改排行榜
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: battleId,});
        }).then(function(){
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: invaderId,});
        }).then(function(){
            return AV.Cloud.run('resetLeaderBoard', {leaderboardName: defenderId,});
        });
        console.log('战场清算'+battleId+" "+ invaderId+ " "+ defenderId+" "+cityName+"完毕");
    });
    return new Promise(resolve => {
       resolve('战场清算全部完毕');
    });
});
AV.Cloud.define('battleOpen', async request => {
    const createQuery = () => {
        return new AV.Query(cityObj).notEqualTo('warPending', null)
    };
    await battleOpen(createQuery, (object) => {
        return object.fetch({ include: ['owner','warPending']}).then(function (city) {
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
                    console.log("battleOpen:城池信息保存成功");
                },function(err){
                    console.log("battleOpen:城池信息保存失败");
                    console.log(err);
                }
            );
        }, function (error) {
            console.log("battleOpen:城池信息获取失败");
            console.log(error);
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

//每天12点和24点 更新魏蜀吴黄巾的可宣战城池
AV.Cloud.define('declarableCities',function(request) {
    //清空所有可宣战城池信息
    var query = new AV.Query('country');
    query.find().then(function (countries) {
        var countryProceeded = 0;
         countries.forEach(function(country){
            country.set('declarables', []);
            countryProceeded++;
            if (countryProceeded === 4){
                AV.Object.saveAll(countries).then(async function(countries){
                    console.log("所有国家的可宣战城池已重置");

                    var weiguo = AV.Object.createWithoutData('country', '5d2d9dc14415dc00089bd0fe');
                    var shuguo = AV.Object.createWithoutData('country', '5d2d9dbd5dfe8c00082f979f');
                    var wuguo = AV.Object.createWithoutData('country', '5d2d9dc54415dc00089bd114');
                    var huangjin = AV.Object.createWithoutData('country', '5d2d9dc95dfe8c00082f97c8');

                    var weiArray = await AV.Cloud.run("findDeclarables", {countryName: 'weiguo'});
                    var shuArray = await AV.Cloud.run("findDeclarables", {countryName: 'shuguo'});
                    var wuArray = await AV.Cloud.run("findDeclarables", {countryName: 'wuguo'});
                    var huangArray = await AV.Cloud.run("findDeclarables", {countryName: 'huangjin'});

                    console.log("weiArray: " + weiArray);
                    console.log("shuArray: " + shuArray);
                    console.log("wuArray: " + wuArray);
                    console.log("huangArray: " + huangArray);
                    weiguo.addUnique('declarables', weiArray);
                    shuguo.addUnique('declarables', shuArray);
                    wuguo.addUnique('declarables', wuArray);
                    huangjin.addUnique('declarables', huangArray);

                    //保存所有
                    Promise.all([weiguo.save(), wuguo.save(), shuguo.save(), huangjin.save()]).then(function(){
                        console.log("所有国家的可选战城池保存完毕");
                    });
                });
            }
        });
    });
});

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
    /*                        console.log("ownerName " + map.get("dest").get("owner").get("name"));
                            console.log("countryName " + countryName);
                            console.log("warPending " + map.get("dest").get("warPending"));*/
                            await countryCities.push(map.get("destCity"));
                            // console.log(countryName + " push城市: " + map.get("destCity"))
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