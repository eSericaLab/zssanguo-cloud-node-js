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

        //修改报单
        if (inventory >= amount){
            console.log("减少报单剩余货量 " + amount + "件");
            offer.increment("amount", -amount);
        }else {
            console.log("库存不足以满足交易量");
            return reject("库存不足以满足交易量");
        }

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
    }, function(){
        console.log("报单,报单主人,交易人更新失败!");
        return Promise.reject("报单,报单主人,交易人更新失败!");
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
