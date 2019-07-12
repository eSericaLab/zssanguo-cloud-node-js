const AV = require('leanengine')
const Promise = require('bluebird')

//TODO 每天24点 isWorked true设置为false
const _User = AV.Object.extend('_User');
AV.Cloud.define('isWorkedReset', async request =>{
    const isWorked = request.params.isWorked || 'true';
    const createQuery = () => {
        return new AV.Query(_User).equalTo('isWorked', isWorked);
    };
    await isWorkedReset(createQuery, (object) => {
        console.log('0点到了,批量更新isWorked为false', object.id);
        object.set('isWorked', false);
        return object.save();
    })
    console.log('isWorked批量更新完成');
});

function isWorkedReset(createQuery, performUpdate, options = {}) {
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

//TODO 每天24点 isTrained true设置为false
AV.Cloud.define('isTrainedReset', async request =>{
    const isTrained = request.params.isTrained || 'true';
    const createQuery = () => {
        return new AV.Query(_User).equalTo('isTrained', isTrained);
    };
    await isTrainedReset(createQuery, (object) => {
        console.log('0点到了,批量更新isTrained为false', object.id);
        object.set('isTrained', false);
        return object.save();
    })
    console.log('isTrained批量更新完成');
});

function isTrainedReset(createQuery, performUpdate, options = {}) {
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

//TODO 每个双整点 canWork false设置为true
AV.Cloud.define('canWorkReset', async request =>{
    const canWork = request.params.canWork || 'false';
    const createQuery = () => {
        return new AV.Query(_User).equalTo('canWork', canWork);
    };
    await canWorkReset(createQuery, (object) => {
        console.log('双整点到了,批量更新canWork为true', object.id);
        object.set('canWork', true);
        return object.save();
    })
    console.log('canWork批量更新完成');
});

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

//TODO 每个双整点 canTrain false设置为true
AV.Cloud.define('canTrainReset', async request =>{
    const canTrain = request.params.canTrain || 'false';
    const createQuery = () => {
        return new AV.Query(_User).equalTo('canTrain', canTrain);
    };
    await canTrainReset(createQuery, (object) => {
        console.log('双整点到了,批量更新canTrain为true', object.id);
        object.set('canTrain', true);
        return object.save();
    })
    console.log('canTrain批量更新完成');
});

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
