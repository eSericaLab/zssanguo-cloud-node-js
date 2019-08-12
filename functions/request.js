const AV = require("leanengine");
const Promise = require("bluebird");

// trade 修改交易人的数据,然后修改被交易人的数据
//params product, price, type,offerId, amount
const User = AV.Object.extend('_User')
AV.Cloud.define("trade", async request => {
    var trader = request.currentUser;
    var params = request.params;
    var product = params.product;
    var price = params.price;
    var type = params.type;
    var offerId = params.offerId;
    var amount = params.amount;

    var offer = AV.Object.createWithoutData('market', offerId);
    offer.fetch({ include: ['owner'] }).then(function(offer){
        var owner = offer.get("owner");

        //如果是买单(trader把物资卖给owner)
        if (type === "buy"){
            //修改trader数据
            //trader物品数量减少
            trader.increment("product", -amount);
            //trader增加钱

        }
    });
})
