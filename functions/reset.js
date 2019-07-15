const AV = require('leanengine')
const Promise = require('bluebird')

/*
 * 批量更新数据示例
 *
 * LeanCloud 只提供了更新单个对象的能力，因此在需要批量更新大量对象时，我们需要先找出需要更新的对象，再逐个更新。
 *
 * 下面提供了两种更新的方式，你可以根据需要选择其中一个：
 * - `canWorkReset`: 通过一个查询来找到需要更新的对象（例如我们要把 status 字段从 a 更新到 b，那么我们就查询 status == a 的对象），
 *                         这种情况下需要保证未更新的对象一定符合这个查询、已更新的对象一定不符合这个查询，否则可能会出现遗漏或死循环。
 * - `batchUpdateAll`: 通过 createdAt 从旧到新更新一个数据表中所有的对象，如果中断需要从日志中的上次中断处重新执行（不能从头执行，否则会重复）。
 *
 *  安装依赖：
 *
 *   npm install bluebird
 *
 */

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

/*
 * canWorkReset 和 batchUpdateAll 的参数：
 *
 * - `createQuery: function(): AV.Query` 返回查询对象，只有符合查询的对象才会被更新。
 * - `performUpdate: function(object): Promise` 执行更新操作的函数，返回一个 Promise。
 *
 * options:
 *
 * - `batchLimit: number` 每一批次更新对象的数量，默认 1000。
 * - `concurrencyLimit: number` 并发更新对象的数量，默认 3，商用版应用可以调到略低于工作线程数。
 * - `ignoreErrors: boolean`: 忽略更新过程中的错误。
 * - `lastCreatedAt: Date`: 从上次中断时的 createdAt 继续（只适用 batchUpdateAll）。
 *
 * 性能优化建议（数据量大于十万条需要考虑）：
 *
 * - canWorkReset 的查询需要有索引。
 * - batchUpdateAll 中的查询需要和 createdAt 有复合索引；如果需要排除的对象很少，可以考虑在 performUpdate 中进行过滤，而不是作为一个查询条件。
 */

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
