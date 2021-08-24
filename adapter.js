const MyPromise = require("./promise");

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

module.exports = adapter;
