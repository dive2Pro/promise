const nextTick = process.nextTick || setImmediate || setTimeout;

let id = 0;
let thens = [];

class MyPromise {
    constructor(cb) {
        this.__ispromise = true;
        this.state = "pending"; // fulfilled, rejected,  ing
        this.value = null;
        this.error = null;
        this.cb = cb;
        this.thens = [];
        this.children = [];
        this.id = id++;
        thens.push(this);

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

    thenWithPromise(promise) {
        this.thens.push([promise])
    }

    // then 的回调总是 nextTick 中执行
    then(promiseResolveFn, projectRejectFn) {
        const self = this;
        const otherPromise = new MyPromise((resolve, reject) => {
        });
        otherPromise.parent = this;
        this.thens.push([otherPromise, promiseResolveFn, projectRejectFn]);
        this.children.push(otherPromise);

        if (!self.isWaiting()) {
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

    isWaiting() {
        return this.state === 'ing' || this.isPending();
    }

    isRejected() {
        return this.state === "rejected";
    }

    fulfill = (val) => {
        if (!this.isPending()) {
            return;
        }
        return this.resolved(val);

    };

    resolved = (val) => {
        try {
            const otherPromise = resolve({fulfill: this.resolved, reject: this.rejected}, val);
            if (isPromise(otherPromise)) {
                if (!this.isWaiting()) {
                } else {
                    this.state = 'ing';
                }
                return otherPromise;
            }
        } catch (e) {
            return this.reject(e);
        }

        this.state = "fulfilled";
        this.value = val;
        this.next();
        return this
    }

    rejected = (err) => {
        // try {
        //     const otherPromise = resolve({fulfill: this.resolved, reject: this.rejected}, err);
        //     if (isPromise(otherPromise)) {
        //         if (!this.isWaiting()) {
        //         } else {
        //             this.state = 'ing';
        //         }
        //         return otherPromise;
        //     }
        // } catch (e) {
        //     err = e;
        // }
        this.error = err;
        this.state = "rejected";
        this.next();
        return this;
    }

    reject = (err) => {
        if (!this.isPending()) {
            return;
        }
        return this.rejected(err);
    };

    next() {
        if (this.isWaiting()) {
            return;
        }
        // console.log("🎇 next", this, this.state, this.value, this.thens);

        const thens = this.thens;
        this.thens = [];
        const self = this;

        nextTick(
            function callback() {
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
    return obj && obj.__ispromise === true;
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
    if (promise.isRejected()) {
        if (isFn(onRejected)) {
            try {
                const res = onRejected(promise.error);
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

function thenable(obj) {
    return obj && (typeof obj === 'function' || typeof obj === 'object');
}

function resolve(promise, x) {
    if (isPromise(x)) {
        return combineToPromise(promise, x);
    } else if (thenable(x)) {
        const then = x.then;
        if (isFn(then)) {
            // 应该要异步执行？
            return combineToPromise(promise, new MyPromise(then.bind(x)))
        }
    }
    return x;
}

function combineToPromise(promise, targetPromise) {
    if (targetPromise.isWaiting()) {
        targetPromise.then(promise.fulfill, promise.reject);
    } else {
        if (targetPromise.isRejected()) {
            promise.reject(targetPromise.error);
        } else {
            // TODO: 当 res.value = promise 的时候
            promise.fulfill(targetPromise.value);
        }
    }
    return targetPromise;
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
        combineToPromise(nextPromise, res);
    } else {
        if (thenable(res)) {
            try {
                const then = res.then;
                if (isFn(then)) {
                    combineToPromise(
                        nextPromise,
                        new MyPromise(then.bind(res))
                    );
                    return;
                }
            } catch (e) {
                nextPromise.reject(e)
            }
        }
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

module.exports = MyPromise;
