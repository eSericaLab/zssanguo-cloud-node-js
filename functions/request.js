const AV = require("leanengine");
const Promise = require("bluebird");

// trade 修改交易人的数据,然后修改被交易人的数据
//params product, price, action, offerId, amount
const User = AV.Object.extend('_User');
AV.Cloud.define("trade", async request => {
    console.log("Trade函数被调用,开始执行");
    var trader = request.currentUser;
    var params = request.params;
    console.log("Trade信息如下");
    console.log(params);
    var product = params.product;
    var price = parseInt(params.price);
    var action = params.action;
    var offerId = params.offerId;
    var amount = parseInt(params.amount);
    console.log("类型: " + action + " 数量: " + amount + " 产品: " + product + " 单价: $" + price);

    var offer = AV.Object.createWithoutData('market', offerId);
    return offer.fetch({ include: ['owner'] }).then(function(offer){
        var owner = offer.get("owner");
        var country = offer.get("country");
        var inventory = offer.get("amount");
        var currency = whatCurrency(country);
        var money = price * amount;
        console.log("国家: " + country + " 货币: " + currency + " 总金额: " + money + " 剩余库存: " + inventory);

        // 检查买家卖家是否为同一人
        if (owner.getUsername() === trader.getUsername()){
            console.log("买家卖家为同一人,终止交易");
            return Promise.reject("买家卖家为同一人,终止交易");
        }
        //检查单价是否为正数
        if (price <= 0){
            console.log("价格小于等于0,终止交易");
            return Promise.reject("价格小于等于0,终止交易");
        }

        //检查货物是否足够
        if (inventory < amount){
            console.log("库存不足以满足交易量");
            return Promise.reject("库存不足以满足交易量");
        }

        //修改报单
        console.log("减少报单剩余货量 " + amount + "件");
        offer.increment("amount", -amount);

        //修改交易人,报单主人
        if (action === "buy"){
            console.log("类型:购买,交易人增加" +amount+ " " + product + " 减少" + money + " " + currency);
            //trader增加物资,减少钱
            trader.increment(product, amount);
            trader.increment(currency,-money);
            //owner减少物资,增加钱
            console.log("类型:购买,报单主人增加" +money+ " " + currency + " 减少" + amount + " " + product);
            owner.increment(product, -amount);
            owner.increment(currency,money);
        }else{
            //trader减少物资,增加钱
            console.log("类型:出售,交易人增加" +money+ " " + currency + " 减少" + amount + " " + product);
            trader.increment(product, -amount);
            trader.increment(currency,money);
            //owner增加物资,减少钱
            console.log("类型:出售,报单主人增加" +amount+ " " + product + " 减少" + money + " " + currency);
            owner.increment(product, amount);
            owner.increment(currency,-money);
        }
        return Promise.all([offer.save(),trader.save()]);   //因为offer.save的时候owner作为pointer已经save了,所以不用再单独save了,如果save,则会重复操作
    }).then(function(){
        console.log("报单,报单主人,交易人更新完毕!");
        return Promise.resolve("报单,报单主人,交易人更新完毕!");
    });
});

function whatCurrency(country){
    switch (country){
        case "weiguo":
            return "weiMoney";
        case "shuguo":
            return "shuMoney";
        case "wuguo":
            return "wuMoney";
        default:
            return "huangMoney";
    }
}

AV.Cloud.define("findUser", async request => {
    console.log("findUser函数被调用,开始执行");
    var params = request.params;
    console.log("user信息如下");
    console.log(params);
    var username = params.username;
    console.log("用户名: " + username);

    var query = new AV.Query('_User');

    query.equalTo("username", username);

    return query.find().then(function(users){
        if (users.length !== 0) {
            let user = users[0];
            console.log("找到用户!");
            console.log(user);
            return Promise.resolve(user);
        }
        console.log("没找到用户!");
        return Promise.reject("没有找到用户!");
    });
});

AV.Cloud.define("redeemPromo", async request => {
    console.log("findPromo函数被调用,开始执行");
    var redeemer = request.currentUser;
    console.log("申请兑换人为:");
    console.log(redeemer.get("username"));
    var params = request.params;
    var promo = params.promo;
    console.log("promo码如下");
    console.log("promo: " + promo);

    var query = new AV.Query('promo');

    query.equalTo("promo", promo);

    return query.find().then(function(promos){
        if (promos.length !== 0) {
            let promo = promos[0];
            console.log("找到激活码,可兑换GOLD为:");
            var gold = promo.get("gold");
            console.log(gold);
            redeemer.increment("gold", gold);
            promo.destroy();
            return Promise.all([redeemer.save(),promo.save()]);
        }
        console.log("没找到激活码!");
        return Promise.reject("没找到激活码!");
    });
});

