
var adapter = require('./adapter');
var resolved = adapter.resolved;
var rejected = adapter.rejected;
var deferred = adapter.deferred;

var promise = rejected();
var promise2 = resolved();
var firstOnRejectedFinished = false;

promise.then(null, function () {
    promise2.then(function () {
        assert.strictEqual(firstOnRejectedFinished, true);
        done();
    });
    firstOnRejectedFinished = true;
});
