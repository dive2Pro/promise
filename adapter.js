const MyPromise = require("./promise");
const MyPromise2 = require('./promise-2');

const adapter = {
    resolved: (value) => {
        return new MyPromise().fulfill(value);
    },
    rejected: (reason) => {
        return new MyPromise().reject(reason);
    },
    deferred: () => {
        const promise = new MyPromise();
        return {
            promise,
            resolve: promise.fulfill,
            reject: promise.reject
        };
    }
};
// const resolved = new MyPromise().fulfill(true);
// const rejected = new MyPromise().reject(false);
const n = {
    resolved: (v) => resolved,
    rejected: () => rejected,
    deferred: () => {
        const promise = new MyPromise();
        return {
            promise,
            resolve: promise.fulfill,
            reject: promise.reject
        };
    }

}

const adapter2 = {
    resolved: v => MyPromise2.resolve(v),
    rejected: MyPromise2.reject,
    deferred: () => {
        const resolver = () => {}
        const promise = new MyPromise2(resolver);
        return {
            promise,
            resolve: promise.resolve,
            reject: promise.reject
        }
    }
}

module.exports = adapter2;
