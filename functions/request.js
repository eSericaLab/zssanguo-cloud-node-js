const AV = require("leanengine");
const Promise = require("bluebird");

// trade 修改交易人的数据,然后修改被交易人的数据
//params product, price, action, offerId, amount
const User = AV.Object.extend('_User')
AV.Cloud.define("trade", async request => {
    console.log("Trade initiated");
    var trader = request.currentUser;
    var params = request.params;
    console.log("params");
    console.log(params);
    var product = params.product;
    var price = parseInt(params.price);
    var action = params.action;
    var offerId = params.offerId;
    var amount = parseInt(params.amount);
    console.log("action: " + action + " amount: " + amount + " product: " + product + " price: " + price);

    var offer = AV.Object.createWithoutData('market', offerId);
    return offer.fetch({ include: ['owner'] }).then(function(offer){
        var owner = offer.get("owner");
        var country = offer.get("country");
        var currency = whatCurrency(country);
        var money = price * amount;
        console.log("country: " + country + " currency: " + currency + " amount: " + amount);

        //action buy(trader买物资)
        if (action === "buy"){
            //trader增加物资,减少钱
            trader.increment(product, amount);
            trader.increment(currency,-money);
            //owner减少物资,增加钱
            console.log(" amount: " + amount + " money: " + money);
            owner.increment(product, -amount);
            owner.increment(currency,money);
        }else{
            //owner增加物资,减少钱
            owner.increment(product, amount);
            owner.increment(currency,-money);
            //trader减少物资,增加钱
            trader.increment(product, -amount);
            trader.increment(currency,money);
        }
        //报单数量减少
        offer.increment("amount", -amount);
        return Promise.all([offer.save(),trader.save()]);   //因为offer.save的时候owner作为pointer已经save了,所以不用再单独save了,如果save,则会重复操作
    }).then(function(){
        console.log("offer, owner, trader 更新完毕!");
        return Promise.resolve("success");
    }, function(){
        console.log("offer, owner, trader 更新失败!");
        return Promise.reject("failure");
    });
})

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
