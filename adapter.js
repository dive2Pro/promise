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

const n = {
    resolved: new MyPromise().fulfill(true),
    rejected: new MyPromise().reject(false),
    deferred: () => {
        const promise = new MyPromise();
        return {
            promise,
            resolve: promise.fulfill,
            reject: promise.reject
        };
    }

}

module.exports = n;
