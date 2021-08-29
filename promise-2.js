/**
 * 写程序之前，要对整个程序的目的和结构要进行设计
 *
 * promise 的 then 使用的是 观察者模式 ？
 *
 *
 */

const nextTick = setTimeout;

const STATUS = {
    pending: "pending",
    resolved: "resolved",
    rejected: "rejected",
    ing: 'ing'
};

function isPromise(obj) {
    return obj && obj.__isPromise;
}

function isFn(fn) {
    return fn && typeof fn === "function";
}

let id = 0;
let promises = [];

class MyPromise {
    static resolve(v) {
        return new MyPromise((resolve) => {
            resolve(v);
        });
    }

    static reject(reason) {
        return new MyPromise((_, reject) => {
            reject(reason);
        });
    }

    static all() {
    }

    static race() {
    }

    /**
     *
     * @param {Function} resolver
     * @param {{onFulFilled, onRejected}} thenParams
     */
    constructor(resolver, thenParams) {
        this.state = STATUS.pending;
        this.value = null;
        this.__isPromise = true;
        this.listeners = new Set();
        this.thenParams = thenParams;
        this.id = id++;
        promises.push(this)
        try {
            resolver(this.resolve, this.reject);
        } catch (e) {
            this.reject(e);
        }
    }

    remove(listener) {
        this.listeners.delete(listener);
    }

    removeListening() {
        this.emitter.remove(this);
    }

    setEmitter(emitter) {
        this.emitter = emitter;
    }

    addListener(otherPromise) {
        this.listeners.add(otherPromise);
        otherPromise.setEmitter(this);
    }

    isPending = () => {
        return this.state === STATUS.pending;
    }
    resolve = (v) => {
        this.sameValid(v);
        if (!this.isPending()) {
            return;
        }
        // TODO, 有没有可能 v 是 Promise 呢？
        if (this.thenParams && this.thenParams.onFulFilled) {
            try {
                // console.log(this.id, ' = id ')
                const returned = this.thenParams.onFulFilled(v);
                this._resolve(returned);
                this.thenParams = null;
            } catch (e) {
                this._reject(e);
            }
        } else {
            this._resolve(v);
        }
    }

    sameValid = v => {
        if (v === this) {
            throw new TypeError("Same")
        }
    }

    reject = (reason) => {
        if (!this.isPending()) {
            return;
        }
        if (this.thenParams && this.thenParams.onRejected) {
            try {
                const returned = this.thenParams.onRejected(reason);
                this._resolve(returned);
                this.thenParams = null;
            } catch (e) {
                this._reject(e);
            }
        } else {
            this._reject(reason);
        }
    }

    _resolve = (valueOrPromiseOrThenable) => {
        this.sameValid(valueOrPromiseOrThenable);
        this.state = STATUS.ing;

      if (isPromise(valueOrPromiseOrThenable)) {
            valueOrPromiseOrThenable.addListener(this);
            valueOrPromiseOrThenable._update();
            return;
        }
        if (valueOrPromiseOrThenable && typeof valueOrPromiseOrThenable === 'object' || typeof valueOrPromiseOrThenable === 'function') {
            try {
                const then = valueOrPromiseOrThenable.then;
                if (isFn(then)) {
                    // thenable
                    this.state = STATUS.ing;
                    // TODO: 把 then 作为 resolver 会导致尚未建立 observer， 从而无法更新
                    const returnedPromise = new MyPromise(then.bind(valueOrPromiseOrThenable));
                    // what to do with this promise
                    returnedPromise.addListener(this);
                    returnedPromise._update();
                    return;
                }
            } catch (e) {
                this._reject(e);
                return;
            }
        }

        this.value = valueOrPromiseOrThenable;
        this.state = STATUS.resolved;
        this._update();
    };

    _reject = (value) => {
        this.state = STATUS.rejected;
        this.value = value;
        this._update();
    };

    _update = () => {
        // UPDATE
        if (this.state === STATUS.pending) {
            return;
        }
        const oldListeners = this.listeners;
        this.listeners = new Set();

        nextTick(() => {
            Array.from(oldListeners).forEach((listener) => {
                listener.removeListening();
                if (this.state === STATUS.rejected) {
                  if(listener.state === STATUS.ing) {
                    listener._reject(this.value);
                  } else {
                    listener.reject(this.value);
                  }
                } else {
                  if(listener.state === STATUS.ing) {
                    listener._resolve(this.value);
                  } else {
                    listener.resolve(this.value);
                  }
                }
            });
        })
    };

    /**
     * then 之后要返回另外一个 MyPromise p2了
     * 两个回调是给 p2 的值， 是当前的 Promise 传过去的。
     *
     * @param {*} onFulFilled
     * @param {*} onRejected
     * @returns
     */

    then = (onFulFilled, onRejected) => {
        const otherPromise = new MyPromise(() => {
        }, {
            onFulFilled: isFn(onFulFilled) ? onFulFilled.bind() : undefined,
            onRejected: isFn(onRejected) ? onRejected.bind() : undefined,
        });

        this.addListener(otherPromise);
        this._update();

        return otherPromise;
    }

    catch() {
    }
}

module.exports = MyPromise;
// new MyPromise((resolve) => {
//     console.log('aha')
//
//     resolve('@@')
//
// })
//     .then(res => {
//         console.log(res);
// })