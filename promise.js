module.exports = class MyPromise {
    constructor(cb) {
        this.state = "pending"; // fulfilled, rejected
        this.value = null;
        this.error = null;
        this.cb = cb;
        this.thens = [];
        if (typeof cb !== "function") {
            return;
            // throw new Error(`arguments cb `);
        }
        try {
            this.cb(this.fulfill, this.reject);
        } catch (e) {
            this.reject(e);
        }
    }

    // then 的回调总是 nextTick 中执行
    then(promiseResolveFn, projectRejectFn) {
        const self = this;
        const otherPromise = new MyPromise((resolve, reject) => {});
        this.thens.push([otherPromise, promiseResolveFn, projectRejectFn]);

        if (!self.isPending()) {
            this.next();
            // if (self.value) {
            //     otherPromise.fulfill(self.value);
            //     if (typeof promiseResolveFn === 'function') {
            //         // 这里也是返回一个 promise
            //     }
            //     // trigger(promiseResolveFn, this.value);
            // }
            // if (self.error) {
            //     otherPromise.reject(self.error);
            //     if (typeof projectRejectFn === 'function') {
            //     }
            //     // trigger(projectRejectFn, this.error);
            // }
        } else {
        }
        // TODO: 返回的是另外一个 Promise
        return otherPromise;
    }

    isPending() {
        return this.state === "pending";
    }

    fulfill = (val) => {
        if (!this.isPending()) {
            return;
        }

        this.state = "fulfilled";
        this.value = val;
        this.next();
    };

    reject = (err) => {
        if (!this.isPending()) {
            return;
        }
        this.state = "rejected";
        this.error = err;
        this.next();
    };

    next() {
        if (this.state === "pending") {
            return;
        }
        // console.log("🎇 next", this, this.state, this.value, this.thens);

        const thens = this.thens;
        this.thens = [];
        const self = this;

        setTimeout(function callback() {
            thens.forEach((then) => {
                thenCall(self, then[0], then[1], then[2]);
            });
        }, 0);
    }
};

function isFn(fnOrNot) {
    return typeof fnOrNot === "function";
}

function isPromise(obj) {
    return MyPromise.prototype.isPrototypeOf(obj);
}

function thenable(obj) {
    return obj && obj.then !== undefined && isFn(obj.then);
}

/**
 *
 * @param {MyPromise} promise
 * @param {MyPromise} nextPromise
 * @param onFulfilled
 * @param onRejected
 */

function thenCall(promise, nextPromise, onFulfilled, onRejected) {
    // 根据 promise 的状态, 返回一个新的 promise
    if (promise.error) {
        if (isFn(onRejected)) {
            try {
                const res = onRejected(promise.error);
                // TODO: if res  thenable
                doThen(nextPromise, res);
            } catch (e) {
                nextPromise.reject(e);
            }
        } else {
            nextPromise.reject(promise.error);
        }
    } else {
        if (isFn(onFulfilled)) {
            try {
                const res = onFulfilled(promise.value);
                doThen(nextPromise, res);
            } catch (e) {
                nextPromise.reject(e);
            }
        } else {
            nextPromise.fulfill(promise.value);
        }
    }
}

/**
 *
 * @param {MyPromise} nextPromise
 * @param {*} res
 */
function doThen(nextPromise, res) {
    if (res === nextPromise) {
        throw new TypeError("相同的 promise");
    } else if (isPromise(res)) {
        res.then(nextPromise.fulfill, nextPromise.reject);
    } else if (thenable(res)) {
        const then = res.then;
        new MyPromise(then).then(
            (v) => console.log(v) || nextPromise.fulfill(v),
            nextPromise.reject
        );
    } else {
        nextPromise.fulfill(res);
    }
}

// const p = new MyPromise((res, rej) => {
//   res(2);
// }).then((v) => {
//   // console.log("v", v);
//   return 2;
// });

function thenOf(msg) {
    return (v) => {
        console.log(`then ${msg} - ${v}`);
    };
}

function errorOf(msg) {
    return (e) => {
        console.log(`error ${msg} - ${e}`);
    };
}

// const p2 = p.then(thenOf("-"), errorOf("@"));

// p2.then(thenOf("p2"));

console.log(" ----- then ----------- ");

// const p3 = new MyPromise((res) => {
//   res(2);
// })
//   .then(() => {
//     return {
//       then(resolve, reject) {
//         console.log("resolve");
//         resolve("5");
//       }
//     };
//   })
//   .then(thenOf("p3"), errorOf("p3"));
