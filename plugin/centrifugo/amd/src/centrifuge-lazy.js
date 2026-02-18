/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var events = {exports: {}};

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  };

var ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}
events.exports = EventEmitter;
events.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

var eventsExports = events.exports;
var EventEmitter$1 = /*@__PURE__*/getDefaultExportFromCjs(eventsExports);

var errorCodes;
(function (errorCodes) {
    errorCodes[errorCodes["timeout"] = 1] = "timeout";
    errorCodes[errorCodes["transportClosed"] = 2] = "transportClosed";
    errorCodes[errorCodes["clientDisconnected"] = 3] = "clientDisconnected";
    errorCodes[errorCodes["clientClosed"] = 4] = "clientClosed";
    errorCodes[errorCodes["clientConnectToken"] = 5] = "clientConnectToken";
    errorCodes[errorCodes["clientRefreshToken"] = 6] = "clientRefreshToken";
    errorCodes[errorCodes["subscriptionUnsubscribed"] = 7] = "subscriptionUnsubscribed";
    errorCodes[errorCodes["subscriptionSubscribeToken"] = 8] = "subscriptionSubscribeToken";
    errorCodes[errorCodes["subscriptionRefreshToken"] = 9] = "subscriptionRefreshToken";
    errorCodes[errorCodes["transportWriteError"] = 10] = "transportWriteError";
    errorCodes[errorCodes["connectionClosed"] = 11] = "connectionClosed";
    errorCodes[errorCodes["badConfiguration"] = 12] = "badConfiguration";
})(errorCodes || (errorCodes = {}));
var connectingCodes;
(function (connectingCodes) {
    connectingCodes[connectingCodes["connectCalled"] = 0] = "connectCalled";
    connectingCodes[connectingCodes["transportClosed"] = 1] = "transportClosed";
    connectingCodes[connectingCodes["noPing"] = 2] = "noPing";
    connectingCodes[connectingCodes["subscribeTimeout"] = 3] = "subscribeTimeout";
    connectingCodes[connectingCodes["unsubscribeError"] = 4] = "unsubscribeError";
})(connectingCodes || (connectingCodes = {}));
var disconnectedCodes;
(function (disconnectedCodes) {
    disconnectedCodes[disconnectedCodes["disconnectCalled"] = 0] = "disconnectCalled";
    disconnectedCodes[disconnectedCodes["unauthorized"] = 1] = "unauthorized";
    disconnectedCodes[disconnectedCodes["badProtocol"] = 2] = "badProtocol";
    disconnectedCodes[disconnectedCodes["messageSizeLimit"] = 3] = "messageSizeLimit";
})(disconnectedCodes || (disconnectedCodes = {}));
var subscribingCodes;
(function (subscribingCodes) {
    subscribingCodes[subscribingCodes["subscribeCalled"] = 0] = "subscribeCalled";
    subscribingCodes[subscribingCodes["transportClosed"] = 1] = "transportClosed";
})(subscribingCodes || (subscribingCodes = {}));
var unsubscribedCodes;
(function (unsubscribedCodes) {
    unsubscribedCodes[unsubscribedCodes["unsubscribeCalled"] = 0] = "unsubscribeCalled";
    unsubscribedCodes[unsubscribedCodes["unauthorized"] = 1] = "unauthorized";
    unsubscribedCodes[unsubscribedCodes["clientClosed"] = 2] = "clientClosed";
})(unsubscribedCodes || (unsubscribedCodes = {}));
var subscriptionFlags;
(function (subscriptionFlags) {
    subscriptionFlags[subscriptionFlags["channelCompaction"] = 1] = "channelCompaction";
})(subscriptionFlags || (subscriptionFlags = {}));

/** State of client. */
var State;
(function (State) {
    State["Disconnected"] = "disconnected";
    State["Connecting"] = "connecting";
    State["Connected"] = "connected";
})(State || (State = {}));
/** State of Subscription */
var SubscriptionState;
(function (SubscriptionState) {
    SubscriptionState["Unsubscribed"] = "unsubscribed";
    SubscriptionState["Subscribing"] = "subscribing";
    SubscriptionState["Subscribed"] = "subscribed";
})(SubscriptionState || (SubscriptionState = {}));

/** @internal */
function startsWith(value, prefix) {
    return value.lastIndexOf(prefix, 0) === 0;
}
/** @internal */
function isFunction(value) {
    if (value === undefined || value === null) {
        return false;
    }
    return typeof value === 'function';
}
/** @internal */
function log(level, args) {
    if (globalThis.console) {
        const logger = globalThis.console[level];
        if (isFunction(logger)) {
            logger.apply(globalThis.console, args);
        }
    }
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
/** @internal */
function backoff(step, min, max) {
    // Full jitter technique, see:
    // https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    if (step > 31) {
        step = 31;
    }
    const interval = randomInt(0, Math.min(max, min * Math.pow(2, step)));
    return Math.min(max, min + interval);
}
/** @internal */
function errorExists(data) {
    return 'error' in data && data.error !== null;
}
/** @internal */
function ttlMilliseconds(ttl) {
    // https://stackoverflow.com/questions/12633405/what-is-the-maximum-delay-for-setinterval
    return Math.min(ttl * 1000, 2147483647);
}

/** Subscription to a channel */
class Subscription extends EventEmitter$1 {
    /** Subscription constructor should not be used directly, create subscriptions using Client method. */
    constructor(centrifuge, channel, options) {
        super();
        this._resubscribeTimeout = null;
        this._refreshTimeout = null;
        this.channel = channel;
        this.state = SubscriptionState.Unsubscribed;
        this._centrifuge = centrifuge;
        this._token = '';
        this._getToken = null;
        this._data = null;
        this._getData = null;
        this._recover = false;
        this._offset = null;
        this._epoch = null;
        this._id = 0;
        this._recoverable = false;
        this._positioned = false;
        this._joinLeave = false;
        this._minResubscribeDelay = 500;
        this._maxResubscribeDelay = 20000;
        this._resubscribeTimeout = null;
        this._resubscribeAttempts = 0;
        this._promises = {};
        this._promiseId = 0;
        this._inflight = false;
        this._refreshTimeout = null;
        this._delta = '';
        this._delta_negotiated = false;
        this._tagsFilter = null;
        this._prevValue = null;
        this._unsubPromise = Promise.resolve();
        this._setOptions(options);
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        if (this._centrifuge._debugEnabled) {
            this.on('state', (ctx) => {
                this._debug('subscription state', channel, ctx.oldState, '->', ctx.newState);
            });
            this.on('error', (ctx) => {
                this._debug('subscription error', channel, ctx);
            });
        }
        else {
            // Avoid unhandled exception in EventEmitter for non-set error handler.
            this.on('error', function () { Function.prototype(); });
        }
    }
    /** ready returns a Promise which resolves upon subscription goes to Subscribed
     * state and rejects in case of subscription goes to Unsubscribed state.
     * Optional timeout can be passed.*/
    ready(timeout) {
        if (this.state === SubscriptionState.Unsubscribed) {
            return Promise.reject({ code: errorCodes.subscriptionUnsubscribed, message: this.state });
        }
        if (this.state === SubscriptionState.Subscribed) {
            return Promise.resolve();
        }
        return new Promise((res, rej) => {
            const ctx = {
                resolve: res,
                reject: rej
            };
            if (timeout) {
                ctx.timeout = setTimeout(function () {
                    rej({ code: errorCodes.timeout, message: 'timeout' });
                }, timeout);
            }
            this._promises[this._nextPromiseId()] = ctx;
        });
    }
    /** subscribe to a channel.*/
    subscribe() {
        if (this._isSubscribed()) {
            return;
        }
        this._resubscribeAttempts = 0;
        this._setSubscribing(subscribingCodes.subscribeCalled, 'subscribe called');
    }
    /** unsubscribe from a channel, keeping position state.*/
    unsubscribe() {
        this._unsubPromise = this._setUnsubscribed(unsubscribedCodes.unsubscribeCalled, 'unsubscribe called', true);
    }
    /** publish data to a channel.*/
    publish(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._methodCall();
            return this._centrifuge.publish(this.channel, data);
        });
    }
    /** get online presence for a channel.*/
    presence() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._methodCall();
            return this._centrifuge.presence(this.channel);
        });
    }
    /** presence stats for a channel (num clients and unique users).*/
    presenceStats() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._methodCall();
            return this._centrifuge.presenceStats(this.channel);
        });
    }
    /** history for a channel. By default it does not return publications (only current
     *  StreamPosition data) – provide an explicit limit > 0 to load publications.*/
    history(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._methodCall();
            return this._centrifuge.history(this.channel, opts);
        });
    }
    /**
     * Sets server-side tags filter for the subscription.
     * This only applies on the next subscription attempt, not the current one.
     * Cannot be used together with delta option.
     *
     * @param tagsFilter - Filter configuration object or null to remove filter
     * @throws {Error} If both delta and tagsFilter are configured
     *
     * @example
     * ```typescript
     * // Simple equality filter
     * sub.setTagsFilter({
     *   key: 'ticker',
     *   cmp: 'eq',
     *   val: 'BTC'
     * });
     * ```
     *
     * @example
     * ```typescript
     * // Complex filter with logical operators
     * sub.setTagsFilter({
     *   op: 'and',
     *   nodes: [
     *     { key: 'ticker', cmp: 'eq', val: 'BTC' },
     *     { key: 'price', cmp: 'gt', val: '50000' }
     *   ]
     * });
     * ```
     *
     * @example
     * ```typescript
     * // Filter with IN operator
     * sub.setTagsFilter({
     *   key: 'ticker',
     *   cmp: 'in',
     *   vals: ['BTC', 'ETH', 'SOL']
     * });
     * ```
     */
    setTagsFilter(tagsFilter) {
        if (tagsFilter && this._delta) {
            throw new Error('cannot use delta and tagsFilter together');
        }
        this._tagsFilter = tagsFilter;
    }
    /** setData allows setting subscription data. This only applied on the next subscription attempt,
     * Note that if getData callback is configured, it will override this value during resubscriptions. */
    setData(data) {
        this._data = data;
    }
    _methodCall() {
        if (this._isSubscribed()) {
            return Promise.resolve();
        }
        if (this._isUnsubscribed()) {
            return Promise.reject({
                code: errorCodes.subscriptionUnsubscribed,
                message: this.state
            });
        }
        return new Promise((resolve, reject) => {
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            const timeoutDuration = this._centrifuge._config.timeout;
            const timeout = setTimeout(() => {
                reject({ code: errorCodes.timeout, message: 'timeout' });
            }, timeoutDuration);
            this._promises[this._nextPromiseId()] = {
                timeout,
                resolve,
                reject
            };
        });
    }
    _nextPromiseId() {
        return ++this._promiseId;
    }
    _needRecover() {
        return this._recover === true;
    }
    _isUnsubscribed() {
        return this.state === SubscriptionState.Unsubscribed;
    }
    _isSubscribing() {
        return this.state === SubscriptionState.Subscribing;
    }
    _isSubscribed() {
        return this.state === SubscriptionState.Subscribed;
    }
    _setState(newState) {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            this.emit('state', { newState, oldState, channel: this.channel });
            return true;
        }
        return false;
    }
    _usesToken() {
        return this._token !== '' || this._getToken !== null;
    }
    _clearSubscribingState() {
        this._resubscribeAttempts = 0;
        this._clearResubscribeTimeout();
    }
    _clearSubscribedState() {
        this._clearRefreshTimeout();
    }
    _setSubscribed(result) {
        if (!this._isSubscribing()) {
            return;
        }
        this._clearSubscribingState();
        if (result.id) {
            this._id = result.id;
        }
        if (result.recoverable) {
            this._recover = true;
            this._offset = result.offset || 0;
            this._epoch = result.epoch || '';
        }
        if (result.delta) {
            this._delta_negotiated = true;
        }
        else {
            this._delta_negotiated = false;
        }
        this._setState(SubscriptionState.Subscribed);
        // @ts-ignore – we are hiding some methods from public API autocompletion.
        const ctx = this._centrifuge._getSubscribeContext(this.channel, result);
        this.emit('subscribed', ctx);
        this._resolvePromises();
        const pubs = result.publications;
        if (pubs && pubs.length > 0) {
            for (const i in pubs) {
                if (!pubs.hasOwnProperty(i)) {
                    continue;
                }
                this._handlePublication(pubs[i]);
            }
        }
        if (result.expires === true) {
            this._refreshTimeout = setTimeout(() => this._refresh(), ttlMilliseconds(result.ttl));
        }
    }
    _setSubscribing(code, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isSubscribing()) {
                return;
            }
            if (this._isSubscribed()) {
                this._clearSubscribedState();
            }
            if (this._setState(SubscriptionState.Subscribing)) {
                this.emit('subscribing', { channel: this.channel, code: code, reason: reason });
            }
            // @ts-ignore – for performance reasons only await _unsubPromise for emulution case where it's required.
            if (this._centrifuge._transport && this._centrifuge._transport.emulation()) {
                yield this._unsubPromise;
            }
            if (!this._isSubscribing()) {
                return;
            }
            this._subscribe();
        });
    }
    _subscribe() {
        this._debug('subscribing on', this.channel);
        if (!this._isTransportOpen()) {
            this._debug('delay subscribe on', this.channel, 'till connected');
            return null;
        }
        if (this._inflight) {
            return null;
        }
        this._inflight = true;
        if (this._canSubscribeWithoutGettingToken()) {
            return this._subscribeWithoutToken();
        }
        this._getSubscriptionToken()
            .then(token => this._handleTokenResponse(token))
            .catch(e => this._handleTokenError(e));
        return null;
    }
    _isTransportOpen() {
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        return this._centrifuge._transportIsOpen;
    }
    _canSubscribeWithoutGettingToken() {
        return !this._usesToken() || !!this._token;
    }
    _subscribeWithoutToken() {
        if (this._getData) {
            this._getDataAndSubscribe(this._token);
            return null;
        }
        else {
            return this._sendSubscribe(this._token);
        }
    }
    _getDataAndSubscribe(token) {
        if (!this._getData) {
            this._inflight = false;
            return;
        }
        this._getData({ channel: this.channel })
            .then(data => {
            if (!this._isSubscribing()) {
                this._inflight = false;
                return;
            }
            this._data = data;
            this._sendSubscribe(token);
        })
            .catch(e => this._handleGetDataError(e));
    }
    _handleGetDataError(error) {
        if (!this._isSubscribing()) {
            this._inflight = false;
            return;
        }
        if (error instanceof UnauthorizedError) {
            this._inflight = false;
            this._failUnauthorized();
            return;
        }
        this.emit('error', {
            type: 'subscribeData',
            channel: this.channel,
            error: {
                code: errorCodes.badConfiguration,
                message: (error === null || error === void 0 ? void 0 : error.toString()) || ''
            }
        });
        this._inflight = false;
        this._scheduleResubscribe();
    }
    _handleTokenResponse(token) {
        if (!this._isSubscribing()) {
            this._inflight = false;
            return;
        }
        if (!token) {
            this._inflight = false;
            this._failUnauthorized();
            return;
        }
        this._token = token;
        if (this._getData) {
            this._getDataAndSubscribe(token);
        }
        else {
            this._sendSubscribe(token);
        }
    }
    _handleTokenError(error) {
        if (!this._isSubscribing()) {
            this._inflight = false;
            return;
        }
        if (error instanceof UnauthorizedError) {
            this._inflight = false;
            this._failUnauthorized();
            return;
        }
        this.emit('error', {
            type: 'subscribeToken',
            channel: this.channel,
            error: {
                code: errorCodes.subscriptionSubscribeToken,
                message: (error === null || error === void 0 ? void 0 : error.toString()) || ''
            }
        });
        this._inflight = false;
        this._scheduleResubscribe();
    }
    _sendSubscribe(token) {
        if (!this._isTransportOpen()) {
            this._inflight = false;
            return null;
        }
        const cmd = this._buildSubscribeCommand(token);
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        this._centrifuge._call(cmd).then(resolveCtx => {
            this._inflight = false;
            const result = resolveCtx.reply.subscribe;
            this._handleSubscribeResponse(result);
            if (resolveCtx.next) {
                resolveCtx.next();
            }
        }, rejectCtx => {
            this._inflight = false;
            this._handleSubscribeError(rejectCtx.error);
            if (rejectCtx.next) {
                rejectCtx.next();
            }
        });
        return cmd;
    }
    _buildSubscribeCommand(token) {
        const req = { channel: this.channel };
        if (token)
            req.token = token;
        if (this._data)
            req.data = this._data;
        if (this._positioned)
            req.positioned = true;
        if (this._recoverable)
            req.recoverable = true;
        if (this._joinLeave)
            req.join_leave = true;
        req.flag = subscriptionFlags.channelCompaction;
        if (this._needRecover()) {
            req.recover = true;
            const offset = this._getOffset();
            if (offset)
                req.offset = offset;
            const epoch = this._getEpoch();
            if (epoch)
                req.epoch = epoch;
        }
        if (this._delta)
            req.delta = this._delta;
        if (this._tagsFilter)
            req.tf = this._tagsFilter;
        return { subscribe: req };
    }
    _debug(...args) {
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        this._centrifuge._debug(...args);
    }
    _handleSubscribeError(error) {
        if (!this._isSubscribing()) {
            return;
        }
        if (error.code === errorCodes.timeout) {
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            this._centrifuge._disconnect(connectingCodes.subscribeTimeout, 'subscribe timeout', true);
            return;
        }
        this._subscribeError(error);
    }
    _handleSubscribeResponse(result) {
        if (!this._isSubscribing()) {
            return;
        }
        this._setSubscribed(result);
    }
    _setUnsubscribed(code, reason, sendUnsubscribe) {
        if (this._isUnsubscribed()) {
            return Promise.resolve();
        }
        let promise = Promise.resolve();
        if (this._isSubscribed()) {
            if (sendUnsubscribe) {
                // @ts-ignore – we are hiding some methods from public API autocompletion.
                promise = this._centrifuge._unsubscribe(this);
            }
            this._clearSubscribedState();
        }
        else if (this._isSubscribing()) {
            if (this._inflight && sendUnsubscribe) {
                // @ts-ignore – we are hiding some methods from public API autocompletion.
                promise = this._centrifuge._unsubscribe(this);
            }
            this._clearSubscribingState();
        }
        this._inflight = false;
        if (this._setState(SubscriptionState.Unsubscribed)) {
            this.emit('unsubscribed', { channel: this.channel, code: code, reason: reason });
        }
        this._rejectPromises({ code: errorCodes.subscriptionUnsubscribed, message: this.state });
        return promise;
    }
    _handlePublication(pub) {
        if (this._delta && this._delta_negotiated) {
            // @ts-ignore – we are hiding some methods from public API autocompletion.
            const { newData, newPrevValue } = this._centrifuge._codec.applyDeltaIfNeeded(pub, this._prevValue);
            pub.data = newData;
            this._prevValue = newPrevValue;
        }
        // @ts-ignore – we are hiding some methods from public API autocompletion.
        const ctx = this._centrifuge._getPublicationContext(this.channel, pub);
        this.emit('publication', ctx);
        if (pub.offset) {
            this._offset = pub.offset;
        }
    }
    _handleJoin(join) {
        // @ts-ignore – we are hiding some methods from public API autocompletion.
        const info = this._centrifuge._getJoinLeaveContext(join.info);
        this.emit('join', { channel: this.channel, info: info });
    }
    _handleLeave(leave) {
        // @ts-ignore – we are hiding some methods from public API autocompletion.
        const info = this._centrifuge._getJoinLeaveContext(leave.info);
        this.emit('leave', { channel: this.channel, info: info });
    }
    _resolvePromises() {
        for (const id in this._promises) {
            if (!this._promises.hasOwnProperty(id)) {
                continue;
            }
            if (this._promises[id].timeout) {
                clearTimeout(this._promises[id].timeout);
            }
            this._promises[id].resolve();
            delete this._promises[id];
        }
    }
    _rejectPromises(err) {
        for (const id in this._promises) {
            if (!this._promises.hasOwnProperty(id)) {
                continue;
            }
            if (this._promises[id].timeout) {
                clearTimeout(this._promises[id].timeout);
            }
            this._promises[id].reject(err);
            delete this._promises[id];
        }
    }
    _scheduleResubscribe() {
        if (!this._isSubscribing()) {
            this._debug('not in subscribing state, skip resubscribe scheduling', this.channel);
            return;
        }
        const self = this;
        const delay = this._getResubscribeDelay();
        this._resubscribeTimeout = setTimeout(function () {
            if (self._isSubscribing()) {
                self._subscribe();
            }
        }, delay);
        this._debug('resubscribe scheduled after ' + delay, this.channel);
    }
    _subscribeError(err) {
        if (!this._isSubscribing()) {
            return;
        }
        if (err.code < 100 || err.code === 109 || err.temporary === true) {
            if (err.code === 109) { // Token expired error.
                this._token = '';
            }
            const errContext = {
                channel: this.channel,
                type: 'subscribe',
                error: err
            };
            if (this._centrifuge.state === State.Connected) {
                this.emit('error', errContext);
            }
            this._scheduleResubscribe();
        }
        else {
            this._setUnsubscribed(err.code, err.message, false);
        }
    }
    _getResubscribeDelay() {
        const delay = backoff(this._resubscribeAttempts, this._minResubscribeDelay, this._maxResubscribeDelay);
        this._resubscribeAttempts++;
        return delay;
    }
    _setOptions(options) {
        if (!options) {
            return;
        }
        if (options.since) {
            this._offset = options.since.offset || 0;
            this._epoch = options.since.epoch || '';
            this._recover = true;
        }
        if (options.data) {
            this._data = options.data;
        }
        if (options.getData) {
            this._getData = options.getData;
        }
        if (options.minResubscribeDelay !== undefined) {
            this._minResubscribeDelay = options.minResubscribeDelay;
        }
        if (options.maxResubscribeDelay !== undefined) {
            this._maxResubscribeDelay = options.maxResubscribeDelay;
        }
        if (options.token) {
            this._token = options.token;
        }
        if (options.getToken) {
            this._getToken = options.getToken;
        }
        if (options.positioned === true) {
            this._positioned = true;
        }
        if (options.recoverable === true) {
            this._recoverable = true;
        }
        if (options.joinLeave === true) {
            this._joinLeave = true;
        }
        if (options.delta) {
            if (options.delta !== 'fossil') {
                throw new Error('unsupported delta format');
            }
            this._delta = options.delta;
        }
        if (options.tagsFilter) {
            this._tagsFilter = options.tagsFilter;
        }
        if (this._tagsFilter && this._delta) {
            throw new Error('cannot use delta and tagsFilter together');
        }
    }
    _getOffset() {
        const offset = this._offset;
        if (offset !== null) {
            return offset;
        }
        return 0;
    }
    _getEpoch() {
        const epoch = this._epoch;
        if (epoch !== null) {
            return epoch;
        }
        return '';
    }
    _clearRefreshTimeout() {
        if (this._refreshTimeout !== null) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = null;
        }
    }
    _clearResubscribeTimeout() {
        if (this._resubscribeTimeout !== null) {
            clearTimeout(this._resubscribeTimeout);
            this._resubscribeTimeout = null;
        }
    }
    _getSubscriptionToken() {
        this._debug('get subscription token for channel', this.channel);
        const ctx = {
            channel: this.channel
        };
        const getToken = this._getToken;
        if (getToken === null) {
            this.emit('error', {
                type: 'configuration',
                channel: this.channel,
                error: {
                    code: errorCodes.badConfiguration,
                    message: 'provide a function to get channel subscription token'
                }
            });
            return Promise.reject(new UnauthorizedError(''));
        }
        return getToken(ctx);
    }
    _refresh() {
        this._clearRefreshTimeout();
        const self = this;
        this._getSubscriptionToken().then(function (token) {
            if (!self._isSubscribed()) {
                return;
            }
            if (!token) {
                self._failUnauthorized();
                return;
            }
            self._token = token;
            const req = {
                channel: self.channel,
                token: token
            };
            const msg = {
                'sub_refresh': req
            };
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            self._centrifuge._call(msg).then(resolveCtx => {
                const result = resolveCtx.reply.sub_refresh;
                self._refreshResponse(result);
                if (resolveCtx.next) {
                    resolveCtx.next();
                }
            }, rejectCtx => {
                self._refreshError(rejectCtx.error);
                if (rejectCtx.next) {
                    rejectCtx.next();
                }
            });
        }).catch(function (e) {
            if (e instanceof UnauthorizedError) {
                self._failUnauthorized();
                return;
            }
            self.emit('error', {
                type: 'refreshToken',
                channel: self.channel,
                error: {
                    code: errorCodes.subscriptionRefreshToken,
                    message: e !== undefined ? e.toString() : ''
                }
            });
            self._refreshTimeout = setTimeout(() => self._refresh(), self._getRefreshRetryDelay());
        });
    }
    _refreshResponse(result) {
        if (!this._isSubscribed()) {
            return;
        }
        this._debug('subscription token refreshed, channel', this.channel);
        this._clearRefreshTimeout();
        if (result.expires === true) {
            this._refreshTimeout = setTimeout(() => this._refresh(), ttlMilliseconds(result.ttl));
        }
    }
    _refreshError(err) {
        if (!this._isSubscribed()) {
            return;
        }
        if (err.code < 100 || err.temporary === true) {
            this.emit('error', {
                type: 'refresh',
                channel: this.channel,
                error: err
            });
            this._refreshTimeout = setTimeout(() => this._refresh(), this._getRefreshRetryDelay());
        }
        else {
            this._setUnsubscribed(err.code, err.message, true);
        }
    }
    _getRefreshRetryDelay() {
        return backoff(0, 10000, 20000);
    }
    _failUnauthorized() {
        this._setUnsubscribed(unsubscribedCodes.unauthorized, 'unauthorized', true);
    }
}

/** @internal */
class SockjsTransport {
    constructor(endpoint, options) {
        this.endpoint = endpoint;
        this.options = options;
        this._transport = null;
    }
    name() {
        return 'sockjs';
    }
    subName() {
        return 'sockjs-' + this._transport.transport;
    }
    emulation() {
        return false;
    }
    supported() {
        return this.options.sockjs !== null;
    }
    initialize(_protocol, callbacks) {
        this._transport = new this.options.sockjs(this.endpoint, null, this.options.sockjsOptions);
        this._transport.onopen = () => {
            callbacks.onOpen();
        };
        this._transport.onerror = e => {
            callbacks.onError(e);
        };
        this._transport.onclose = closeEvent => {
            callbacks.onClose(closeEvent);
        };
        this._transport.onmessage = event => {
            callbacks.onMessage(event.data);
        };
    }
    close() {
        this._transport.close();
    }
    send(data) {
        this._transport.send(data);
    }
}

/** @internal */
class WebsocketTransport {
    constructor(endpoint, options) {
        this.endpoint = endpoint;
        this.options = options;
        this._transport = null;
    }
    name() {
        return 'websocket';
    }
    subName() {
        return 'websocket';
    }
    emulation() {
        return false;
    }
    supported() {
        return this.options.websocket !== undefined && this.options.websocket !== null;
    }
    initialize(protocol, callbacks) {
        let subProtocol = '';
        if (protocol === 'protobuf') {
            subProtocol = 'centrifuge-protobuf';
        }
        if (subProtocol !== '') {
            this._transport = new this.options.websocket(this.endpoint, subProtocol);
        }
        else {
            this._transport = new this.options.websocket(this.endpoint);
        }
        if (protocol === 'protobuf') {
            this._transport.binaryType = 'arraybuffer';
        }
        this._transport.onopen = () => {
            callbacks.onOpen();
        };
        this._transport.onerror = e => {
            callbacks.onError(e);
        };
        this._transport.onclose = closeEvent => {
            callbacks.onClose(closeEvent);
        };
        this._transport.onmessage = event => {
            callbacks.onMessage(event.data);
        };
    }
    close() {
        this._transport.close();
    }
    send(data) {
        this._transport.send(data);
    }
}

/** @internal */
class HttpStreamTransport {
    constructor(endpoint, options) {
        this.endpoint = endpoint;
        this.options = options;
        this._abortController = null;
        this._utf8decoder = new TextDecoder();
        this._protocol = 'json';
    }
    name() {
        return 'http_stream';
    }
    subName() {
        return 'http_stream';
    }
    emulation() {
        return true;
    }
    _handleErrors(response) {
        if (!response.ok)
            throw new Error(response.status);
        return response;
    }
    _fetchEventTarget(self, endpoint, options) {
        const eventTarget = new EventTarget();
        // fetch with connection timeout maybe? https://github.com/github/fetch/issues/175
        const fetchFunc = self.options.fetch;
        fetchFunc(endpoint, options)
            .then(self._handleErrors)
            .then(response => {
            eventTarget.dispatchEvent(new Event('open'));
            let jsonStreamBuf = '';
            let jsonStreamPos = 0;
            let protoStreamBuf = new Uint8Array();
            const reader = response.body.getReader();
            return new self.options.readableStream({
                start(controller) {
                    function pump() {
                        return reader.read().then(({ done, value }) => {
                            // When no more data needs to be consumed, close the stream
                            if (done) {
                                eventTarget.dispatchEvent(new Event('close'));
                                controller.close();
                                return;
                            }
                            try {
                                if (self._protocol === 'json') {
                                    jsonStreamBuf += self._utf8decoder.decode(value);
                                    while (jsonStreamPos < jsonStreamBuf.length) {
                                        if (jsonStreamBuf[jsonStreamPos] === '\n') {
                                            const line = jsonStreamBuf.substring(0, jsonStreamPos);
                                            eventTarget.dispatchEvent(new MessageEvent('message', { data: line }));
                                            jsonStreamBuf = jsonStreamBuf.substring(jsonStreamPos + 1);
                                            jsonStreamPos = 0;
                                        }
                                        else {
                                            ++jsonStreamPos;
                                        }
                                    }
                                }
                                else {
                                    const mergedArray = new Uint8Array(protoStreamBuf.length + value.length);
                                    mergedArray.set(protoStreamBuf);
                                    mergedArray.set(value, protoStreamBuf.length);
                                    protoStreamBuf = mergedArray;
                                    while (true) {
                                        const result = self.options.decoder.decodeReply(protoStreamBuf);
                                        if (result.ok) {
                                            const data = protoStreamBuf.slice(0, result.pos);
                                            eventTarget.dispatchEvent(new MessageEvent('message', { data: data }));
                                            protoStreamBuf = protoStreamBuf.slice(result.pos);
                                            continue;
                                        }
                                        break;
                                    }
                                }
                            }
                            catch (error) {
                                // @ts-ignore - improve later.
                                eventTarget.dispatchEvent(new Event('error', { detail: error }));
                                eventTarget.dispatchEvent(new Event('close'));
                                controller.close();
                                return;
                            }
                            pump();
                        }).catch(function (e) {
                            // @ts-ignore - improve later.
                            eventTarget.dispatchEvent(new Event('error', { detail: e }));
                            eventTarget.dispatchEvent(new Event('close'));
                            controller.close();
                            return;
                        });
                    }
                    return pump();
                }
            });
        })
            .catch(error => {
            // @ts-ignore - improve later.
            eventTarget.dispatchEvent(new Event('error', { detail: error }));
            eventTarget.dispatchEvent(new Event('close'));
        });
        return eventTarget;
    }
    supported() {
        return this.options.fetch !== null &&
            this.options.readableStream !== null &&
            typeof TextDecoder !== 'undefined' &&
            typeof AbortController !== 'undefined' &&
            typeof EventTarget !== 'undefined' &&
            typeof Event !== 'undefined' &&
            typeof MessageEvent !== 'undefined' &&
            typeof Error !== 'undefined';
    }
    initialize(protocol, callbacks, initialData) {
        this._protocol = protocol;
        this._abortController = new AbortController();
        let headers;
        let body;
        if (protocol === 'json') {
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            body = initialData;
        }
        else {
            headers = {
                'Accept': 'application/octet-stream',
                'Content-Type': 'application/octet-stream'
            };
            body = initialData;
        }
        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: body,
            mode: 'cors',
            credentials: 'same-origin',
            signal: this._abortController.signal
        };
        const eventTarget = this._fetchEventTarget(this, this.endpoint, fetchOptions);
        eventTarget.addEventListener('open', () => {
            callbacks.onOpen();
        });
        eventTarget.addEventListener('error', (e) => {
            this._abortController.abort();
            callbacks.onError(e);
        });
        eventTarget.addEventListener('close', () => {
            this._abortController.abort();
            callbacks.onClose({
                code: 4,
                reason: 'connection closed'
            });
        });
        eventTarget.addEventListener('message', (e) => {
            callbacks.onMessage(e.data);
        });
    }
    close() {
        this._abortController.abort();
    }
    send(data, session, node) {
        let headers;
        let body;
        const req = {
            session: session,
            node: node,
            data: data
        };
        if (this._protocol === 'json') {
            headers = {
                'Content-Type': 'application/json'
            };
            body = JSON.stringify(req);
        }
        else {
            headers = {
                'Content-Type': 'application/octet-stream'
            };
            body = this.options.encoder.encodeEmulationRequest(req);
        }
        const fetchFunc = this.options.fetch;
        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: body,
            mode: 'cors',
            credentials: 'same-origin',
        };
        fetchFunc(this.options.emulationEndpoint, fetchOptions);
    }
}

/** @internal */
class SseTransport {
    constructor(endpoint, options) {
        this.endpoint = endpoint;
        this.options = options;
        this._protocol = 'json';
        this._transport = null;
        this._onClose = null;
    }
    name() {
        return 'sse';
    }
    subName() {
        return 'sse';
    }
    emulation() {
        return true;
    }
    supported() {
        return this.options.eventsource !== null && this.options.fetch !== null;
    }
    initialize(_protocol, callbacks, initialData) {
        let url;
        if (globalThis && globalThis.document && globalThis.document.baseURI) {
            // Handle case when endpoint is relative, like //example.com/connection/sse
            url = new URL(this.endpoint, globalThis.document.baseURI);
        }
        else {
            url = new URL(this.endpoint);
        }
        url.searchParams.append('cf_connect', initialData);
        const eventsourceOptions = {};
        const eventSource = new this.options.eventsource(url.toString(), eventsourceOptions);
        this._transport = eventSource;
        const self = this;
        eventSource.onopen = function () {
            callbacks.onOpen();
        };
        eventSource.onerror = function (e) {
            eventSource.close();
            callbacks.onError(e);
            callbacks.onClose({
                code: 4,
                reason: 'connection closed'
            });
        };
        eventSource.onmessage = function (e) {
            callbacks.onMessage(e.data);
        };
        self._onClose = function () {
            callbacks.onClose({
                code: 4,
                reason: 'connection closed'
            });
        };
    }
    close() {
        this._transport.close();
        if (this._onClose !== null) {
            this._onClose();
        }
    }
    send(data, session, node) {
        const req = {
            session: session,
            node: node,
            data: data
        };
        const headers = {
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify(req);
        const fetchFunc = this.options.fetch;
        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: body,
            mode: 'cors',
            credentials: 'same-origin',
        };
        fetchFunc(this.options.emulationEndpoint, fetchOptions);
    }
}

/** @internal */
class WebtransportTransport {
    constructor(endpoint, options) {
        this.endpoint = endpoint;
        this.options = options;
        this._transport = null;
        this._stream = null;
        this._writer = null;
        this._utf8decoder = new TextDecoder();
        this._protocol = 'json';
    }
    name() {
        return 'webtransport';
    }
    subName() {
        return 'webtransport';
    }
    emulation() {
        return false;
    }
    supported() {
        return this.options.webtransport !== undefined && this.options.webtransport !== null;
    }
    initialize(protocol, callbacks) {
        return __awaiter(this, void 0, void 0, function* () {
            let url;
            if (globalThis && globalThis.document && globalThis.document.baseURI) {
                // Handle case when endpoint is relative, like //example.com/connection/webtransport
                url = new URL(this.endpoint, globalThis.document.baseURI);
            }
            else {
                url = new URL(this.endpoint);
            }
            if (protocol === 'protobuf') {
                url.searchParams.append('cf_protocol', 'protobuf');
            }
            this._protocol = protocol;
            const eventTarget = new EventTarget();
            this._transport = new this.options.webtransport(url.toString());
            this._transport.closed.then(() => {
                callbacks.onClose({
                    code: 4,
                    reason: 'connection closed'
                });
            }).catch(() => {
                callbacks.onClose({
                    code: 4,
                    reason: 'connection closed'
                });
            });
            try {
                yield this._transport.ready;
            }
            catch (_a) {
                this.close();
                return;
            }
            let stream;
            try {
                stream = yield this._transport.createBidirectionalStream();
            }
            catch (_b) {
                this.close();
                return;
            }
            this._stream = stream;
            this._writer = this._stream.writable.getWriter();
            eventTarget.addEventListener('close', () => {
                callbacks.onClose({
                    code: 4,
                    reason: 'connection closed'
                });
            });
            eventTarget.addEventListener('message', (e) => {
                callbacks.onMessage(e.data);
            });
            this._startReading(eventTarget);
            callbacks.onOpen();
        });
    }
    _startReading(eventTarget) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = this._stream.readable.getReader();
            let jsonStreamBuf = '';
            let jsonStreamPos = 0;
            let protoStreamBuf = new Uint8Array();
            try {
                while (true) {
                    const { done, value } = yield reader.read();
                    if (value.length > 0) {
                        if (this._protocol === 'json') {
                            jsonStreamBuf += this._utf8decoder.decode(value);
                            while (jsonStreamPos < jsonStreamBuf.length) {
                                if (jsonStreamBuf[jsonStreamPos] === '\n') {
                                    const line = jsonStreamBuf.substring(0, jsonStreamPos);
                                    eventTarget.dispatchEvent(new MessageEvent('message', { data: line }));
                                    jsonStreamBuf = jsonStreamBuf.substring(jsonStreamPos + 1);
                                    jsonStreamPos = 0;
                                }
                                else {
                                    ++jsonStreamPos;
                                }
                            }
                        }
                        else {
                            const mergedArray = new Uint8Array(protoStreamBuf.length + value.length);
                            mergedArray.set(protoStreamBuf);
                            mergedArray.set(value, protoStreamBuf.length);
                            protoStreamBuf = mergedArray;
                            while (true) {
                                const result = this.options.decoder.decodeReply(protoStreamBuf);
                                if (result.ok) {
                                    const data = protoStreamBuf.slice(0, result.pos);
                                    eventTarget.dispatchEvent(new MessageEvent('message', { data: data }));
                                    protoStreamBuf = protoStreamBuf.slice(result.pos);
                                    continue;
                                }
                                break;
                            }
                        }
                    }
                    if (done) {
                        break;
                    }
                }
            }
            catch (_a) {
                eventTarget.dispatchEvent(new Event('close'));
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._writer) {
                    yield this._writer.close();
                }
                this._transport.close();
            }
            catch (e) {
                // already closed.
            }
        });
    }
    send(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let binary;
            if (this._protocol === 'json') {
                // Need extra \n since WT is non-frame protocol. 
                binary = new TextEncoder().encode(data + '\n');
            }
            else {
                binary = data;
            }
            try {
                yield this._writer.write(binary);
            }
            catch (e) {
                this.close();
            }
        });
    }
}

/*
Copyright 2014-2024 Dmitry Chestnykh (JavaScript port)
Copyright 2007 D. Richard Hipp  (original C version)

Fossil SCM delta compression algorithm, this is only the applyDelta part extracted
from https://github.com/dchest/fossil-delta-js. The code was slightly modified
to strip unnecessary parts. The copyright on top of this file is from the original
repo on Github licensed under Simplified BSD License.
*/
const zValue = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1,
    -1, -1, -1, -1, -1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, -1, -1, -1, -1, 36, -1, 37,
    38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
    57, 58, 59, 60, 61, 62, -1, -1, -1, 63, -1,
];
// Reader reads bytes, chars, ints from array.
class Reader {
    constructor(array) {
        this.a = array; // source array
        this.pos = 0; // current position in array
    }
    haveBytes() {
        return this.pos < this.a.length;
    }
    getByte() {
        const b = this.a[this.pos];
        this.pos++;
        if (this.pos > this.a.length)
            throw new RangeError("out of bounds");
        return b;
    }
    getChar() {
        return String.fromCharCode(this.getByte());
    }
    // Read base64-encoded unsigned integer.
    getInt() {
        let v = 0;
        let c;
        while (this.haveBytes() && (c = zValue[0x7f & this.getByte()]) >= 0) {
            v = (v << 6) + c;
        }
        this.pos--;
        return v >>> 0;
    }
}
// Write writes an array.
class Writer {
    constructor() {
        this.a = [];
    }
    toByteArray(sourceType) {
        if (Array.isArray(sourceType)) {
            return this.a;
        }
        return new Uint8Array(this.a);
    }
    // Copy from array at start to end.
    putArray(a, start, end) {
        // TODO: optimize.
        for (let i = start; i < end; i++)
            this.a.push(a[i]);
    }
}
// Return a 32-bit checksum of the array.
function checksum(arr) {
    let sum0 = 0, sum1 = 0, sum2 = 0, sum3 = 0, z = 0, N = arr.length;
    //TODO measure if this unrolling is helpful.
    while (N >= 16) {
        sum0 = (sum0 + arr[z + 0]) | 0;
        sum1 = (sum1 + arr[z + 1]) | 0;
        sum2 = (sum2 + arr[z + 2]) | 0;
        sum3 = (sum3 + arr[z + 3]) | 0;
        sum0 = (sum0 + arr[z + 4]) | 0;
        sum1 = (sum1 + arr[z + 5]) | 0;
        sum2 = (sum2 + arr[z + 6]) | 0;
        sum3 = (sum3 + arr[z + 7]) | 0;
        sum0 = (sum0 + arr[z + 8]) | 0;
        sum1 = (sum1 + arr[z + 9]) | 0;
        sum2 = (sum2 + arr[z + 10]) | 0;
        sum3 = (sum3 + arr[z + 11]) | 0;
        sum0 = (sum0 + arr[z + 12]) | 0;
        sum1 = (sum1 + arr[z + 13]) | 0;
        sum2 = (sum2 + arr[z + 14]) | 0;
        sum3 = (sum3 + arr[z + 15]) | 0;
        z += 16;
        N -= 16;
    }
    while (N >= 4) {
        sum0 = (sum0 + arr[z + 0]) | 0;
        sum1 = (sum1 + arr[z + 1]) | 0;
        sum2 = (sum2 + arr[z + 2]) | 0;
        sum3 = (sum3 + arr[z + 3]) | 0;
        z += 4;
        N -= 4;
    }
    sum3 = (((((sum3 + (sum2 << 8)) | 0) + (sum1 << 16)) | 0) + (sum0 << 24)) | 0;
    switch (N) {
        //@ts-ignore fallthrough is needed.
        case 3:
            sum3 = (sum3 + (arr[z + 2] << 8)) | 0; /* falls through */
        //@ts-ignore fallthrough is needed.
        case 2:
            sum3 = (sum3 + (arr[z + 1] << 16)) | 0; /* falls through */
        case 1:
            sum3 = (sum3 + (arr[z + 0] << 24)) | 0; /* falls through */
    }
    return sum3 >>> 0;
}
/**
 * Apply a delta byte array to a source byte array, returning the target byte array.
 */
function applyDelta(source, delta) {
    let total = 0;
    const zDelta = new Reader(delta);
    const lenSrc = source.length;
    const lenDelta = delta.length;
    const limit = zDelta.getInt();
    if (zDelta.getChar() !== "\n")
        throw new Error("size integer not terminated by '\\n'");
    const zOut = new Writer();
    while (zDelta.haveBytes()) {
        const cnt = zDelta.getInt();
        let ofst;
        switch (zDelta.getChar()) {
            case "@":
                ofst = zDelta.getInt();
                if (zDelta.haveBytes() && zDelta.getChar() !== ",")
                    throw new Error("copy command not terminated by ','");
                total += cnt;
                if (total > limit)
                    throw new Error("copy exceeds output file size");
                if (ofst + cnt > lenSrc)
                    throw new Error("copy extends past end of input");
                zOut.putArray(source, ofst, ofst + cnt);
                break;
            case ":":
                total += cnt;
                if (total > limit)
                    throw new Error("insert command gives an output larger than predicted");
                if (cnt > lenDelta)
                    throw new Error("insert count exceeds size of delta");
                zOut.putArray(zDelta.a, zDelta.pos, zDelta.pos + cnt);
                zDelta.pos += cnt;
                break;
            case ";":
                {
                    const out = zOut.toByteArray(source);
                    if (cnt !== checksum(out))
                        throw new Error("bad checksum");
                    if (total !== limit)
                        throw new Error("generated size does not match predicted size");
                    return out;
                }
            default:
                throw new Error("unknown delta operator");
        }
    }
    throw new Error("unterminated delta");
}

/** @internal */
class JsonCodec {
    name() {
        return 'json';
    }
    encodeCommands(commands) {
        return commands.map(c => JSON.stringify(c)).join('\n');
    }
    decodeReplies(data) {
        return data.trim().split('\n').map(r => JSON.parse(r));
    }
    applyDeltaIfNeeded(pub, prevValue) {
        let newData, newPrevValue;
        if (pub.delta) {
            // JSON string delta.
            const valueArray = applyDelta(prevValue, new TextEncoder().encode(pub.data));
            newData = JSON.parse(new TextDecoder().decode(valueArray));
            newPrevValue = valueArray;
        }
        else {
            // Full data as JSON string.
            newData = JSON.parse(pub.data);
            newPrevValue = new TextEncoder().encode(pub.data);
        }
        return { newData, newPrevValue };
    }
}

const defaults = {
    headers: {},
    token: '',
    getToken: null,
    data: null,
    getData: null,
    debug: false,
    name: 'js',
    version: '',
    fetch: null,
    readableStream: null,
    websocket: null,
    eventsource: null,
    sockjs: null,
    sockjsOptions: {},
    emulationEndpoint: '/emulation',
    minReconnectDelay: 500,
    maxReconnectDelay: 20000,
    timeout: 5000,
    maxServerPingDelay: 10000,
    networkEventTarget: null,
};
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
/** Centrifuge is a Centrifuge/Centrifugo bidirectional client. */
class Centrifuge extends EventEmitter$1 {
    /** Constructs Centrifuge client. Call connect() method to start connecting. */
    constructor(endpoint, options) {
        super();
        this._reconnectTimeout = null;
        this._refreshTimeout = null;
        this._serverPingTimeout = null;
        this.state = State.Disconnected;
        this._transportIsOpen = false;
        this._endpoint = endpoint;
        this._emulation = false;
        this._transports = [];
        this._currentTransportIndex = 0;
        this._triedAllTransports = false;
        this._transportWasOpen = false;
        this._transport = null;
        this._transportId = 0;
        this._deviceWentOffline = false;
        this._transportClosed = true;
        this._codec = new JsonCodec();
        this._reconnecting = false;
        this._reconnectTimeout = null;
        this._reconnectAttempts = 0;
        this._client = null;
        this._session = '';
        this._node = '';
        this._subs = {};
        this._serverSubs = {};
        this._commandId = 0;
        this._commands = [];
        this._batching = false;
        this._refreshRequired = false;
        this._refreshTimeout = null;
        this._callbacks = {};
        this._token = '';
        this._data = null;
        this._dispatchPromise = Promise.resolve();
        this._serverPing = 0;
        this._serverPingTimeout = null;
        this._sendPong = false;
        this._promises = {};
        this._promiseId = 0;
        this._debugEnabled = false;
        this._networkEventsSet = false;
        this._config = Object.assign(Object.assign({}, defaults), options);
        this._configure();
        if (this._debugEnabled) {
            this.on('state', (ctx) => {
                this._debug('client state', ctx.oldState, '->', ctx.newState);
            });
            this.on('error', (ctx) => {
                this._debug('client error', ctx);
            });
        }
        else {
            // Avoid unhandled exception in EventEmitter for non-set error handler.
            this.on('error', function () { Function.prototype(); });
        }
    }
    /** newSubscription allocates new Subscription to a channel. Since server only allows
     * one subscription per channel per client this method throws if client already has
     * channel subscription in internal registry.
     * */
    newSubscription(channel, options) {
        if (this.getSubscription(channel) !== null) {
            throw new Error('Subscription to the channel ' + channel + ' already exists');
        }
        const sub = new Subscription(this, channel, options);
        this._subs[channel] = sub;
        return sub;
    }
    /** getSubscription returns Subscription if it's registered in the internal
     * registry or null. */
    getSubscription(channel) {
        return this._getSub(channel);
    }
    /** removeSubscription allows removing Subcription from the internal registry. */
    removeSubscription(sub) {
        if (!sub) {
            return;
        }
        if (sub.state !== SubscriptionState.Unsubscribed) {
            sub.unsubscribe();
        }
        this._removeSubscription(sub);
    }
    /** Get a map with all current client-side subscriptions. */
    subscriptions() {
        return this._subs;
    }
    /** ready returns a Promise which resolves upon client goes to Connected
     * state and rejects in case of client goes to Disconnected or Failed state.
     * Users can provide optional timeout in milliseconds. */
    ready(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.state) {
                case State.Disconnected:
                    throw { code: errorCodes.clientDisconnected, message: 'client disconnected' };
                case State.Connected:
                    return;
                default:
                    return new Promise((resolve, reject) => {
                        const ctx = { resolve, reject };
                        if (timeout) {
                            ctx.timeout = setTimeout(() => {
                                reject({ code: errorCodes.timeout, message: 'timeout' });
                            }, timeout);
                        }
                        this._promises[this._nextPromiseId()] = ctx;
                    });
            }
        });
    }
    /** connect to a server. */
    connect() {
        if (this._isConnected()) {
            this._debug('connect called when already connected');
            return;
        }
        if (this._isConnecting()) {
            this._debug('connect called when already connecting');
            return;
        }
        this._debug('connect called');
        this._reconnectAttempts = 0;
        this._startConnecting();
    }
    /** disconnect from a server. */
    disconnect() {
        this._disconnect(disconnectedCodes.disconnectCalled, 'disconnect called', false);
    }
    /** setToken allows setting connection token. Or resetting used token to be empty.  */
    setToken(token) {
        this._token = token;
    }
    /** setData allows setting connection data. This only affects the next connection attempt,
     * not the current one. Note that if getData callback is configured, it will override
     * this value during reconnects. */
    setData(data) {
        this._data = data;
    }
    /** setHeaders allows setting connection emulated headers. */
    setHeaders(headers) {
        this._config.headers = headers;
    }
    /** send asynchronous data to a server (without any response from a server
     * expected, see rpc method if you need response). */
    send(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                send: {
                    data
                }
            };
            yield this._methodCall();
            const sent = this._transportSendCommands([cmd]); // can send message to server without id set
            if (!sent) {
                throw this._createErrorObject(errorCodes.transportWriteError, 'transport write error');
            }
        });
    }
    /** rpc to a server - i.e. a call which waits for a response with data. */
    rpc(method, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                rpc: {
                    method,
                    data
                }
            };
            yield this._methodCall();
            const result = yield this._callPromise(cmd, (reply) => reply.rpc);
            return {
                data: result.data
            };
        });
    }
    /** publish data to a channel. */
    publish(channel, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                publish: {
                    channel,
                    data
                }
            };
            yield this._methodCall();
            yield this._callPromise(cmd, () => ({}));
            return {};
        });
    }
    /** history for a channel. By default it does not return publications (only current
     *  StreamPosition data) – provide an explicit limit > 0 to load publications.*/
    history(channel, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                history: this._getHistoryRequest(channel, options)
            };
            yield this._methodCall();
            const result = yield this._callPromise(cmd, (reply) => reply.history);
            const publications = [];
            if (result.publications) {
                for (let i = 0; i < result.publications.length; i++) {
                    publications.push(this._getPublicationContext(channel, result.publications[i]));
                }
            }
            return {
                publications,
                epoch: result.epoch || '',
                offset: result.offset || 0
            };
        });
    }
    /** presence for a channel. */
    presence(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                presence: {
                    channel
                }
            };
            yield this._methodCall();
            const result = yield this._callPromise(cmd, (reply) => reply.presence);
            const clients = result.presence;
            for (const clientId in clients) {
                if (Object.prototype.hasOwnProperty.call(clients, clientId)) {
                    const rawClient = clients[clientId];
                    const connInfo = rawClient['conn_info'];
                    const chanInfo = rawClient['chan_info'];
                    if (connInfo) {
                        rawClient.connInfo = connInfo;
                    }
                    if (chanInfo) {
                        rawClient.chanInfo = chanInfo;
                    }
                }
            }
            return { clients };
        });
    }
    presenceStats(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = {
                'presence_stats': {
                    channel
                }
            };
            yield this._methodCall();
            const result = yield this._callPromise(cmd, (reply) => {
                return reply.presence_stats;
            });
            return {
                numUsers: result.num_users,
                numClients: result.num_clients
            };
        });
    }
    /** start command batching (collect into temporary buffer without sending to a server)
     * until stopBatching called.*/
    startBatching() {
        // start collecting messages without sending them to Centrifuge until flush
        // method called
        this._batching = true;
    }
    /** stop batching commands and flush collected commands to the
     * network (all in one request/frame).*/
    stopBatching() {
        const self = this;
        // Why so nested? Two levels here requred to deal with promise resolving queue.
        // In Subscription case we wait 2 futures before sending data to connection.
        // Otherwise _batching becomes false before batching decision has a chance to be executed.
        Promise.resolve().then(function () {
            Promise.resolve().then(function () {
                self._batching = false;
                self._flush();
            });
        });
    }
    _debug(...args) {
        if (!this._debugEnabled) {
            return;
        }
        log('debug', args);
    }
    _codecName() {
        return this._codec.name();
    }
    /** @internal */
    _formatOverride() {
        return;
    }
    _configure() {
        if (!('Promise' in globalThis)) {
            throw new Error('Promise polyfill required');
        }
        if (!this._endpoint) {
            throw new Error('endpoint configuration required');
        }
        if (this._config.token !== null) {
            this._token = this._config.token;
        }
        if (this._config.data !== null) {
            this._data = this._config.data;
        }
        this._codec = new JsonCodec();
        this._formatOverride();
        if (this._config.debug === true ||
            (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' && localStorage.getItem('centrifuge.debug'))) {
            this._debugEnabled = true;
        }
        this._debug('config', this._config);
        if (typeof this._endpoint === 'string') ;
        else if (Array.isArray(this._endpoint)) {
            this._transports = this._endpoint;
            this._emulation = true;
            for (const i in this._transports) {
                if (this._transports.hasOwnProperty(i)) {
                    const transportConfig = this._transports[i];
                    if (!transportConfig.endpoint || !transportConfig.transport) {
                        throw new Error('malformed transport configuration');
                    }
                    const transportName = transportConfig.transport;
                    if (['websocket', 'http_stream', 'sse', 'sockjs', 'webtransport'].indexOf(transportName) < 0) {
                        throw new Error('unsupported transport name: ' + transportName);
                    }
                }
            }
        }
        else {
            throw new Error('unsupported url configuration type: only string or array of objects are supported');
        }
    }
    _setState(newState) {
        if (this.state !== newState) {
            this._reconnecting = false;
            const oldState = this.state;
            this.state = newState;
            this.emit('state', { newState, oldState });
            return true;
        }
        return false;
    }
    _isDisconnected() {
        return this.state === State.Disconnected;
    }
    _isConnecting() {
        return this.state === State.Connecting;
    }
    _isConnected() {
        return this.state === State.Connected;
    }
    _nextCommandId() {
        return ++this._commandId;
    }
    _setNetworkEvents() {
        if (this._networkEventsSet) {
            return;
        }
        let eventTarget = null;
        if (this._config.networkEventTarget !== null) {
            eventTarget = this._config.networkEventTarget;
        }
        else if (typeof globalThis.addEventListener !== 'undefined') {
            eventTarget = globalThis;
        }
        if (eventTarget) {
            eventTarget.addEventListener('offline', () => {
                this._debug('offline event triggered');
                if (this.state === State.Connected || this.state === State.Connecting) {
                    this._disconnect(connectingCodes.transportClosed, 'transport closed', true);
                    this._deviceWentOffline = true;
                }
            });
            eventTarget.addEventListener('online', () => {
                this._debug('online event triggered');
                if (this.state !== State.Connecting) {
                    return;
                }
                if (this._deviceWentOffline && !this._transportClosed) {
                    // This is a workaround for mobile Safari where close callback may be
                    // not issued upon device going to the flight mode. We know for sure
                    // that transport close was called, so we start reconnecting. In this
                    // case if the close callback will be issued for some reason after some
                    // time – it will be ignored due to transport ID mismatch.
                    this._deviceWentOffline = false;
                    this._transportClosed = true;
                }
                this._clearReconnectTimeout();
                this._startReconnecting();
            });
            this._networkEventsSet = true;
        }
    }
    _getReconnectDelay() {
        const delay = backoff(this._reconnectAttempts, this._config.minReconnectDelay, this._config.maxReconnectDelay);
        this._reconnectAttempts += 1;
        return delay;
    }
    _clearOutgoingRequests() {
        // fire errbacks of registered outgoing calls.
        for (const id in this._callbacks) {
            if (this._callbacks.hasOwnProperty(id)) {
                const callbacks = this._callbacks[id];
                clearTimeout(callbacks.timeout);
                const errback = callbacks.errback;
                if (!errback) {
                    continue;
                }
                errback({ error: this._createErrorObject(errorCodes.connectionClosed, 'connection closed') });
            }
        }
        this._callbacks = {};
    }
    _clearConnectedState() {
        this._client = null;
        this._clearServerPingTimeout();
        this._clearRefreshTimeout();
        // fire events for client-side subscriptions.
        for (const channel in this._subs) {
            if (!this._subs.hasOwnProperty(channel)) {
                continue;
            }
            const sub = this._subs[channel];
            if (sub.state === SubscriptionState.Subscribed) {
                // @ts-ignore – we are hiding some symbols from public API autocompletion.
                sub._setSubscribing(subscribingCodes.transportClosed, 'transport closed');
            }
        }
        // fire events for server-side subscriptions.
        for (const channel in this._serverSubs) {
            if (this._serverSubs.hasOwnProperty(channel)) {
                this.emit('subscribing', { channel: channel });
            }
        }
    }
    _handleWriteError(commands) {
        for (const command of commands) {
            const id = command.id;
            if (!(id in this._callbacks)) {
                continue;
            }
            const callbacks = this._callbacks[id];
            clearTimeout(this._callbacks[id].timeout);
            delete this._callbacks[id];
            const errback = callbacks.errback;
            errback({ error: this._createErrorObject(errorCodes.transportWriteError, 'transport write error') });
        }
    }
    _transportSendCommands(commands) {
        if (!commands.length) {
            return true;
        }
        if (!this._transport) {
            return false;
        }
        try {
            this._transport.send(this._codec.encodeCommands(commands), this._session, this._node);
        }
        catch (e) {
            this._debug('error writing commands', e);
            this._handleWriteError(commands);
            return false;
        }
        return true;
    }
    _initializeTransport() {
        let websocket;
        if (this._config.websocket !== null) {
            websocket = this._config.websocket;
        }
        else {
            if (!(typeof globalThis.WebSocket !== 'function' && typeof globalThis.WebSocket !== 'object')) {
                websocket = globalThis.WebSocket;
            }
        }
        let sockjs = null;
        if (this._config.sockjs !== null) {
            sockjs = this._config.sockjs;
        }
        else {
            if (typeof globalThis.SockJS !== 'undefined') {
                sockjs = globalThis.SockJS;
            }
        }
        let eventsource = null;
        if (this._config.eventsource !== null) {
            eventsource = this._config.eventsource;
        }
        else {
            if (typeof globalThis.EventSource !== 'undefined') {
                eventsource = globalThis.EventSource;
            }
        }
        let fetchFunc = null;
        if (this._config.fetch !== null) {
            fetchFunc = this._config.fetch;
        }
        else {
            if (typeof globalThis.fetch !== 'undefined') {
                fetchFunc = globalThis.fetch;
            }
        }
        let readableStream = null;
        if (this._config.readableStream !== null) {
            readableStream = this._config.readableStream;
        }
        else {
            if (typeof globalThis.ReadableStream !== 'undefined') {
                readableStream = globalThis.ReadableStream;
            }
        }
        if (!this._emulation) {
            if (startsWith(this._endpoint, 'http')) {
                throw new Error('Provide explicit transport endpoints configuration in case of using HTTP (i.e. using array of TransportEndpoint instead of a single string), or use ws(s):// scheme in an endpoint if you aimed using WebSocket transport');
            }
            else {
                this._debug('client will use websocket');
                this._transport = new WebsocketTransport(this._endpoint, {
                    websocket: websocket
                });
                if (!this._transport.supported()) {
                    throw new Error('WebSocket constructor not found, make sure it is available globally or passed as a dependency in Centrifuge options');
                }
            }
        }
        else {
            if (this._currentTransportIndex >= this._transports.length) {
                this._triedAllTransports = true;
                this._currentTransportIndex = 0;
            }
            let count = 0;
            while (true) {
                if (count >= this._transports.length) {
                    throw new Error('no supported transport found');
                }
                const transportConfig = this._transports[this._currentTransportIndex];
                const transportName = transportConfig.transport;
                const transportEndpoint = transportConfig.endpoint;
                if (transportName === 'websocket') {
                    this._debug('trying websocket transport');
                    this._transport = new WebsocketTransport(transportEndpoint, {
                        websocket: websocket
                    });
                    if (!this._transport.supported()) {
                        this._debug('websocket transport not available');
                        this._currentTransportIndex++;
                        count++;
                        continue;
                    }
                }
                else if (transportName === 'webtransport') {
                    this._debug('trying webtransport transport');
                    this._transport = new WebtransportTransport(transportEndpoint, {
                        webtransport: globalThis.WebTransport,
                        decoder: this._codec,
                        encoder: this._codec
                    });
                    if (!this._transport.supported()) {
                        this._debug('webtransport transport not available');
                        this._currentTransportIndex++;
                        count++;
                        continue;
                    }
                }
                else if (transportName === 'http_stream') {
                    this._debug('trying http_stream transport');
                    this._transport = new HttpStreamTransport(transportEndpoint, {
                        fetch: fetchFunc,
                        readableStream: readableStream,
                        emulationEndpoint: this._config.emulationEndpoint,
                        decoder: this._codec,
                        encoder: this._codec
                    });
                    if (!this._transport.supported()) {
                        this._debug('http_stream transport not available');
                        this._currentTransportIndex++;
                        count++;
                        continue;
                    }
                }
                else if (transportName === 'sse') {
                    this._debug('trying sse transport');
                    this._transport = new SseTransport(transportEndpoint, {
                        eventsource: eventsource,
                        fetch: fetchFunc,
                        emulationEndpoint: this._config.emulationEndpoint,
                    });
                    if (!this._transport.supported()) {
                        this._debug('sse transport not available');
                        this._currentTransportIndex++;
                        count++;
                        continue;
                    }
                }
                else if (transportName === 'sockjs') {
                    this._debug('trying sockjs');
                    this._transport = new SockjsTransport(transportEndpoint, {
                        sockjs: sockjs,
                        sockjsOptions: this._config.sockjsOptions
                    });
                    if (!this._transport.supported()) {
                        this._debug('sockjs transport not available');
                        this._currentTransportIndex++;
                        count++;
                        continue;
                    }
                }
                else {
                    throw new Error('unknown transport ' + transportName);
                }
                break;
            }
        }
        const self = this;
        const transport = this._transport;
        const transportId = this._nextTransportId();
        self._debug("id of transport", transportId);
        let wasOpen = false;
        const initialCommands = [];
        if (this._transport.emulation()) {
            const connectCommand = self._sendConnect(true);
            initialCommands.push(connectCommand);
        }
        this._setNetworkEvents();
        const initialData = this._codec.encodeCommands(initialCommands);
        this._transportClosed = false;
        let connectTimeout;
        connectTimeout = setTimeout(function () {
            transport.close();
        }, this._config.timeout);
        this._transport.initialize(this._codecName(), {
            onOpen: function () {
                if (connectTimeout) {
                    clearTimeout(connectTimeout);
                    connectTimeout = null;
                }
                if (self._transportId != transportId) {
                    self._debug('open callback from non-actual transport');
                    transport.close();
                    return;
                }
                wasOpen = true;
                self._debug(transport.subName(), 'transport open');
                if (transport.emulation()) {
                    return;
                }
                self._transportIsOpen = true;
                self._transportWasOpen = true;
                self.startBatching();
                self._sendConnect(false);
                self._sendSubscribeCommands();
                self.stopBatching();
                //@ts-ignore must be used only for debug and test purposes. Exposed only for non-emulation transport.
                self.emit('__centrifuge_debug:connect_frame_sent', {});
            },
            onError: function (e) {
                if (self._transportId != transportId) {
                    self._debug('error callback from non-actual transport');
                    return;
                }
                self._debug('transport level error', e);
            },
            onClose: function (closeEvent) {
                if (connectTimeout) {
                    clearTimeout(connectTimeout);
                    connectTimeout = null;
                }
                if (self._transportId != transportId) {
                    self._debug('close callback from non-actual transport');
                    return;
                }
                self._debug(transport.subName(), 'transport closed');
                self._transportClosed = true;
                self._transportIsOpen = false;
                let reason = 'connection closed';
                let needReconnect = true;
                let code = 0;
                if (closeEvent && 'code' in closeEvent && closeEvent.code) {
                    code = closeEvent.code;
                }
                if (closeEvent && closeEvent.reason) {
                    try {
                        const advice = JSON.parse(closeEvent.reason);
                        reason = advice.reason;
                        needReconnect = advice.reconnect;
                    }
                    catch (e) {
                        reason = closeEvent.reason;
                        if ((code >= 3500 && code < 4000) || (code >= 4500 && code < 5000)) {
                            needReconnect = false;
                        }
                    }
                }
                if (code < 3000) {
                    if (code === 1009) {
                        code = disconnectedCodes.messageSizeLimit;
                        reason = 'message size limit exceeded';
                        needReconnect = false;
                    }
                    else {
                        code = connectingCodes.transportClosed;
                        reason = 'transport closed';
                    }
                    if (self._emulation && !self._transportWasOpen) {
                        self._currentTransportIndex++;
                        if (self._currentTransportIndex >= self._transports.length) {
                            self._triedAllTransports = true;
                            self._currentTransportIndex = 0;
                        }
                    }
                }
                else {
                    // Codes >= 3000 are sent from a server application level.
                    self._transportWasOpen = true;
                }
                if (self._isConnecting() && !wasOpen) {
                    self.emit('error', {
                        type: 'transport',
                        error: {
                            code: errorCodes.transportClosed,
                            message: 'transport closed'
                        },
                        transport: transport.name()
                    });
                }
                self._reconnecting = false;
                self._disconnect(code, reason, needReconnect);
            },
            onMessage: function (data) {
                self._dataReceived(data);
            }
        }, initialData);
        //@ts-ignore must be used only for debug and test purposes.
        self.emit('__centrifuge_debug:transport_initialized', {});
    }
    _sendConnect(skipSending) {
        const connectCommand = this._constructConnectCommand();
        const self = this;
        this._call(connectCommand, skipSending).then(resolveCtx => {
            const result = resolveCtx.reply.connect;
            self._connectResponse(result);
            if (resolveCtx.next) {
                resolveCtx.next();
            }
        }, rejectCtx => {
            self._connectError(rejectCtx.error);
            if (rejectCtx.next) {
                rejectCtx.next();
            }
        });
        return connectCommand;
    }
    _startReconnecting() {
        this._debug('start reconnecting');
        if (!this._isConnecting()) {
            this._debug('stop reconnecting: client not in connecting state');
            return;
        }
        if (this._reconnecting) {
            this._debug('reconnect already in progress, return from reconnect routine');
            return;
        }
        if (this._transportClosed === false) {
            this._debug('waiting for transport close');
            return;
        }
        this._reconnecting = true;
        const emptyToken = this._token === '';
        const needTokenRefresh = this._refreshRequired || (emptyToken && this._config.getToken !== null);
        if (!needTokenRefresh) {
            if (this._config.getData) {
                this._config.getData().then(data => {
                    if (!this._isConnecting()) {
                        return;
                    }
                    this._data = data;
                    this._initializeTransport();
                })
                    .catch(e => this._handleGetDataError(e));
            }
            else {
                this._initializeTransport();
            }
            return;
        }
        const self = this;
        this._getToken().then(function (token) {
            if (!self._isConnecting()) {
                return;
            }
            if (token == null || token == undefined) {
                self._failUnauthorized();
                return;
            }
            self._token = token;
            self._debug('connection token refreshed');
            if (self._config.getData) {
                self._config.getData().then(function (data) {
                    if (!self._isConnecting()) {
                        return;
                    }
                    self._data = data;
                    self._initializeTransport();
                })
                    .catch(e => self._handleGetDataError(e));
            }
            else {
                self._initializeTransport();
            }
        }).catch(function (e) {
            if (!self._isConnecting()) {
                return;
            }
            if (e instanceof UnauthorizedError) {
                self._failUnauthorized();
                return;
            }
            self.emit('error', {
                'type': 'connectToken',
                'error': {
                    code: errorCodes.clientConnectToken,
                    message: e !== undefined ? e.toString() : ''
                }
            });
            const delay = self._getReconnectDelay();
            self._debug('error on getting connection token, reconnect after ' + delay + ' milliseconds', e);
            self._reconnecting = false;
            self._reconnectTimeout = setTimeout(() => {
                self._startReconnecting();
            }, delay);
        });
    }
    _handleGetDataError(e) {
        if (e instanceof UnauthorizedError) {
            this._failUnauthorized();
            return;
        }
        this.emit('error', {
            type: 'connectData',
            error: {
                code: errorCodes.badConfiguration,
                message: (e === null || e === void 0 ? void 0 : e.toString()) || ''
            }
        });
        const delay = this._getReconnectDelay();
        this._debug('error on getting connect data, reconnect after ' + delay + ' milliseconds', e);
        this._reconnecting = false;
        this._reconnectTimeout = setTimeout(() => {
            this._startReconnecting();
        }, delay);
    }
    _connectError(err) {
        if (this.state !== State.Connecting) {
            return;
        }
        if (err.code === 109) { // token expired.
            // next connect attempt will try to refresh token.
            this._refreshRequired = true;
        }
        if (err.code < 100 || err.temporary === true || err.code === 109) {
            this.emit('error', {
                'type': 'connect',
                'error': err
            });
            this._debug('closing transport due to connect error');
            this._disconnect(err.code, err.message, true);
        }
        else {
            this._disconnect(err.code, err.message, false);
        }
    }
    _scheduleReconnect() {
        if (!this._isConnecting()) {
            return;
        }
        let isInitialHandshake = false;
        if (this._emulation && !this._transportWasOpen && !this._triedAllTransports) {
            isInitialHandshake = true;
        }
        let delay = this._getReconnectDelay();
        if (isInitialHandshake) {
            delay = 0;
        }
        this._debug('reconnect after ' + delay + ' milliseconds');
        this._clearReconnectTimeout();
        this._reconnectTimeout = setTimeout(() => {
            this._startReconnecting();
        }, delay);
    }
    _constructConnectCommand() {
        const req = {};
        if (this._token) {
            req.token = this._token;
        }
        if (this._data) {
            req.data = this._data;
        }
        if (this._config.name) {
            req.name = this._config.name;
        }
        if (this._config.version) {
            req.version = this._config.version;
        }
        if (Object.keys(this._config.headers).length > 0) {
            req.headers = this._config.headers;
        }
        const subs = {};
        let hasSubs = false;
        for (const channel in this._serverSubs) {
            if (this._serverSubs.hasOwnProperty(channel) && this._serverSubs[channel].recoverable) {
                hasSubs = true;
                const sub = {
                    'recover': true
                };
                if (this._serverSubs[channel].offset) {
                    sub['offset'] = this._serverSubs[channel].offset;
                }
                if (this._serverSubs[channel].epoch) {
                    sub['epoch'] = this._serverSubs[channel].epoch;
                }
                subs[channel] = sub;
            }
        }
        if (hasSubs) {
            req.subs = subs;
        }
        return {
            connect: req
        };
    }
    _getHistoryRequest(channel, options) {
        const req = {
            channel: channel
        };
        if (options !== undefined) {
            if (options.since) {
                req.since = {
                    offset: options.since.offset
                };
                if (options.since.epoch) {
                    req.since.epoch = options.since.epoch;
                }
            }
            if (options.limit !== undefined) {
                req.limit = options.limit;
            }
            if (options.reverse === true) {
                req.reverse = true;
            }
        }
        return req;
    }
    _methodCall() {
        if (this._isConnected()) {
            return Promise.resolve();
        }
        return new Promise((res, rej) => {
            const timeout = setTimeout(function () {
                rej({ code: errorCodes.timeout, message: 'timeout' });
            }, this._config.timeout);
            this._promises[this._nextPromiseId()] = {
                timeout: timeout,
                resolve: res,
                reject: rej
            };
        });
    }
    _callPromise(cmd, resultCB) {
        return new Promise((resolve, reject) => {
            this._call(cmd, false).then((resolveCtx) => {
                var _a;
                const result = resultCB(resolveCtx.reply);
                resolve(result);
                (_a = resolveCtx.next) === null || _a === void 0 ? void 0 : _a.call(resolveCtx);
            }, (rejectCtx) => {
                var _a;
                reject(rejectCtx.error);
                (_a = rejectCtx.next) === null || _a === void 0 ? void 0 : _a.call(rejectCtx);
            });
        });
    }
    _dataReceived(data) {
        if (this._serverPing > 0) {
            this._waitServerPing();
        }
        const replies = this._codec.decodeReplies(data);
        // We have to guarantee order of events in replies processing - i.e. start processing
        // next reply only when we finished processing of current one. Without syncing things in
        // this way we could get wrong publication events order as reply promises resolve
        // on next loop tick so for loop continues before we finished emitting all reply events.
        this._dispatchPromise = this._dispatchPromise.then(() => {
            let finishDispatch;
            this._dispatchPromise = new Promise(resolve => {
                finishDispatch = resolve;
            });
            this._dispatchSynchronized(replies, finishDispatch);
        });
    }
    _dispatchSynchronized(replies, finishDispatch) {
        let p = Promise.resolve();
        for (const i in replies) {
            if (replies.hasOwnProperty(i)) {
                p = p.then(() => {
                    return this._dispatchReply(replies[i]);
                });
            }
        }
        p = p.then(() => {
            finishDispatch();
        });
    }
    _dispatchReply(reply) {
        let next;
        const p = new Promise(resolve => {
            next = resolve;
        });
        if (reply === undefined || reply === null) {
            this._debug('dispatch: got undefined or null reply');
            next();
            return p;
        }
        const id = reply.id;
        if (id && id > 0) {
            this._handleReply(reply, next);
        }
        else {
            if (!reply.push) {
                this._handleServerPing(next);
            }
            else {
                this._handlePush(reply.push, next);
            }
        }
        return p;
    }
    _call(cmd, skipSending) {
        return new Promise((resolve, reject) => {
            cmd.id = this._nextCommandId();
            this._registerCall(cmd.id, resolve, reject);
            if (!skipSending) {
                this._addCommand(cmd);
            }
        });
    }
    _startConnecting() {
        this._debug('start connecting');
        if (this._setState(State.Connecting)) {
            this.emit('connecting', { code: connectingCodes.connectCalled, reason: 'connect called' });
        }
        this._client = null;
        this._startReconnecting();
    }
    _disconnect(code, reason, reconnect) {
        if (this._isDisconnected()) {
            return;
        }
        // we mark transport is closed right away, because _clearConnectedState will move subscriptions to subscribing state
        // if transport will still be open at this time, subscribe frames will be sent to closing transport
        this._transportIsOpen = false;
        const previousState = this.state;
        this._reconnecting = false;
        const ctx = {
            code: code,
            reason: reason
        };
        let needEvent = false;
        if (reconnect) {
            needEvent = this._setState(State.Connecting);
        }
        else {
            needEvent = this._setState(State.Disconnected);
            this._rejectPromises({ code: errorCodes.clientDisconnected, message: 'disconnected' });
        }
        this._clearOutgoingRequests();
        if (previousState === State.Connecting) {
            this._clearReconnectTimeout();
        }
        if (previousState === State.Connected) {
            this._clearConnectedState();
        }
        if (needEvent) {
            if (this._isConnecting()) {
                this.emit('connecting', ctx);
            }
            else {
                this.emit('disconnected', ctx);
            }
        }
        if (this._transport) {
            this._debug("closing existing transport");
            const transport = this._transport;
            this._transport = null;
            transport.close(); // Close only after setting this._transport to null to avoid recursion when calling transport close().
            // Need to mark as closed here, because connect call may be sync called after disconnect,
            // transport onClose callback will not be called yet
            this._transportClosed = true;
            this._nextTransportId();
        }
        else {
            this._debug("no transport to close");
        }
        this._scheduleReconnect();
    }
    _failUnauthorized() {
        this._disconnect(disconnectedCodes.unauthorized, 'unauthorized', false);
    }
    _getToken() {
        this._debug('get connection token');
        if (!this._config.getToken) {
            this.emit('error', {
                type: 'configuration',
                error: {
                    code: errorCodes.badConfiguration,
                    message: 'token expired but no getToken function set in the configuration'
                }
            });
            return Promise.reject(new UnauthorizedError(''));
        }
        return this._config.getToken({});
    }
    _refresh() {
        const clientId = this._client;
        const self = this;
        this._getToken().then(function (token) {
            if (clientId !== self._client) {
                return;
            }
            if (!token) {
                self._failUnauthorized();
                return;
            }
            self._token = token;
            self._debug('connection token refreshed');
            if (!self._isConnected()) {
                return;
            }
            const cmd = {
                refresh: { token: self._token }
            };
            self._call(cmd, false).then(resolveCtx => {
                const result = resolveCtx.reply.refresh;
                self._refreshResponse(result);
                if (resolveCtx.next) {
                    resolveCtx.next();
                }
            }, rejectCtx => {
                self._refreshError(rejectCtx.error);
                if (rejectCtx.next) {
                    rejectCtx.next();
                }
            });
        }).catch(function (e) {
            if (!self._isConnected()) {
                return;
            }
            if (e instanceof UnauthorizedError) {
                self._failUnauthorized();
                return;
            }
            self.emit('error', {
                type: 'refreshToken',
                error: {
                    code: errorCodes.clientRefreshToken,
                    message: e !== undefined ? e.toString() : ''
                }
            });
            self._refreshTimeout = setTimeout(() => self._refresh(), self._getRefreshRetryDelay());
        });
    }
    _refreshError(err) {
        if (err.code < 100 || err.temporary === true) {
            this.emit('error', {
                type: 'refresh',
                error: err
            });
            this._refreshTimeout = setTimeout(() => this._refresh(), this._getRefreshRetryDelay());
        }
        else {
            this._disconnect(err.code, err.message, false);
        }
    }
    _getRefreshRetryDelay() {
        return backoff(0, 5000, 10000);
    }
    _refreshResponse(result) {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = null;
        }
        if (result.expires) {
            this._client = result.client;
            this._refreshTimeout = setTimeout(() => this._refresh(), ttlMilliseconds(result.ttl));
        }
    }
    _removeSubscription(sub) {
        if (sub === null) {
            return;
        }
        delete this._subs[sub.channel];
    }
    _unsubscribe(sub) {
        if (!this._transportIsOpen) {
            return Promise.resolve();
        }
        const req = {
            channel: sub.channel
        };
        const cmd = { unsubscribe: req };
        const self = this;
        const unsubscribePromise = new Promise((resolve, _) => {
            this._call(cmd, false).then(resolveCtx => {
                resolve();
                if (resolveCtx.next) {
                    resolveCtx.next();
                }
            }, rejectCtx => {
                resolve();
                if (rejectCtx.next) {
                    rejectCtx.next();
                }
                self._disconnect(connectingCodes.unsubscribeError, 'unsubscribe error', true);
            });
        });
        return unsubscribePromise;
    }
    _getSub(channel, id) {
        if (id && id > 0) {
            for (const ch in this._subs) {
                if (this._subs.hasOwnProperty(ch)) {
                    const sub = this._subs[ch];
                    // @ts-ignore – we are accessing private property for internal use
                    if (sub._id === id) {
                        return sub;
                    }
                }
            }
            return null;
        }
        const sub = this._subs[channel];
        if (!sub) {
            return null;
        }
        return sub;
    }
    _isServerSub(channel) {
        return this._serverSubs[channel] !== undefined;
    }
    _sendSubscribeCommands() {
        const commands = [];
        for (const channel in this._subs) {
            if (!this._subs.hasOwnProperty(channel)) {
                continue;
            }
            const sub = this._subs[channel];
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            if (sub._inflight === true) {
                continue;
            }
            if (sub.state === SubscriptionState.Subscribing) {
                // @ts-ignore – we are hiding some symbols from public API autocompletion.
                const cmd = sub._subscribe();
                if (cmd) {
                    commands.push(cmd);
                }
            }
        }
        return commands;
    }
    _connectResponse(result) {
        this._transportIsOpen = true;
        this._transportWasOpen = true;
        this._reconnectAttempts = 0;
        this._refreshRequired = false;
        if (this._isConnected()) {
            return;
        }
        this._client = result.client;
        this._setState(State.Connected);
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }
        if (result.expires) {
            this._refreshTimeout = setTimeout(() => this._refresh(), ttlMilliseconds(result.ttl));
        }
        this._session = result.session;
        this._node = result.node;
        this.startBatching();
        this._sendSubscribeCommands();
        this.stopBatching();
        const ctx = {
            client: result.client,
            transport: this._transport.subName()
        };
        if (result.data) {
            ctx.data = result.data;
        }
        this.emit('connected', ctx);
        this._resolvePromises();
        this._processServerSubs(result.subs || {});
        if (result.ping && result.ping > 0) {
            this._serverPing = result.ping * 1000;
            this._sendPong = result.pong === true;
            this._waitServerPing();
        }
        else {
            this._serverPing = 0;
        }
    }
    _processServerSubs(subs) {
        for (const channel in subs) {
            if (!subs.hasOwnProperty(channel)) {
                continue;
            }
            const sub = subs[channel];
            this._serverSubs[channel] = {
                'offset': sub.offset,
                'epoch': sub.epoch,
                'recoverable': sub.recoverable || false
            };
            const subCtx = this._getSubscribeContext(channel, sub);
            this.emit('subscribed', subCtx);
        }
        for (const channel in subs) {
            if (!subs.hasOwnProperty(channel)) {
                continue;
            }
            const sub = subs[channel];
            if (sub.recovered) {
                const pubs = sub.publications;
                if (pubs && pubs.length > 0) {
                    for (const i in pubs) {
                        if (pubs.hasOwnProperty(i)) {
                            this._handlePublication(channel, pubs[i]);
                        }
                    }
                }
            }
        }
        for (const channel in this._serverSubs) {
            if (!this._serverSubs.hasOwnProperty(channel)) {
                continue;
            }
            if (!subs[channel]) {
                this.emit('unsubscribed', { channel: channel });
                delete this._serverSubs[channel];
            }
        }
    }
    _clearRefreshTimeout() {
        if (this._refreshTimeout !== null) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = null;
        }
    }
    _clearReconnectTimeout() {
        if (this._reconnectTimeout !== null) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }
    }
    _clearServerPingTimeout() {
        if (this._serverPingTimeout !== null) {
            clearTimeout(this._serverPingTimeout);
            this._serverPingTimeout = null;
        }
    }
    _waitServerPing() {
        if (this._config.maxServerPingDelay === 0) {
            return;
        }
        if (!this._isConnected()) {
            return;
        }
        this._clearServerPingTimeout();
        this._serverPingTimeout = setTimeout(() => {
            if (!this._isConnected()) {
                return;
            }
            this._disconnect(connectingCodes.noPing, 'no ping', true);
        }, this._serverPing + this._config.maxServerPingDelay);
    }
    _getSubscribeContext(channel, result) {
        const ctx = {
            channel: channel,
            positioned: false,
            recoverable: false,
            wasRecovering: false,
            recovered: false,
            hasRecoveredPublications: false,
        };
        if (result.recovered) {
            ctx.recovered = true;
        }
        if (result.positioned) {
            ctx.positioned = true;
        }
        if (result.recoverable) {
            ctx.recoverable = true;
        }
        if (result.was_recovering) {
            ctx.wasRecovering = true;
        }
        let epoch = '';
        if ('epoch' in result) {
            epoch = result.epoch;
        }
        let offset = 0;
        if ('offset' in result) {
            offset = result.offset;
        }
        if (ctx.positioned || ctx.recoverable) {
            ctx.streamPosition = {
                'offset': offset,
                'epoch': epoch
            };
        }
        if (Array.isArray(result.publications) && result.publications.length > 0) {
            ctx.hasRecoveredPublications = true;
        }
        if (result.data) {
            ctx.data = result.data;
        }
        return ctx;
    }
    _handleReply(reply, next) {
        const id = reply.id;
        if (!(id in this._callbacks)) {
            next();
            return;
        }
        const callbacks = this._callbacks[id];
        clearTimeout(this._callbacks[id].timeout);
        delete this._callbacks[id];
        if (!errorExists(reply)) {
            const callback = callbacks.callback;
            if (!callback) {
                return;
            }
            callback({ reply, next });
        }
        else {
            const errback = callbacks.errback;
            if (!errback) {
                next();
                return;
            }
            const error = { code: reply.error.code, message: reply.error.message || '', temporary: reply.error.temporary || false };
            errback({ error, next });
        }
    }
    _handleJoin(channel, join, id) {
        const sub = this._getSub(channel, id);
        if (!sub && channel) {
            if (this._isServerSub(channel)) {
                const ctx = { channel: channel, info: this._getJoinLeaveContext(join.info) };
                this.emit('join', ctx);
            }
            return;
        }
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        sub._handleJoin(join);
    }
    _handleLeave(channel, leave, id) {
        const sub = this._getSub(channel, id);
        if (!sub && channel) {
            if (this._isServerSub(channel)) {
                const ctx = { channel: channel, info: this._getJoinLeaveContext(leave.info) };
                this.emit('leave', ctx);
            }
            return;
        }
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        sub._handleLeave(leave);
    }
    _handleUnsubscribe(channel, unsubscribe) {
        const sub = this._getSub(channel, 0);
        if (!sub && channel) {
            if (this._isServerSub(channel)) {
                delete this._serverSubs[channel];
                this.emit('unsubscribed', { channel: channel });
            }
            return;
        }
        if (unsubscribe.code < 2500) {
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            sub._setUnsubscribed(unsubscribe.code, unsubscribe.reason, false);
        }
        else {
            // @ts-ignore – we are hiding some symbols from public API autocompletion.
            sub._setSubscribing(unsubscribe.code, unsubscribe.reason);
        }
    }
    _handleSubscribe(channel, sub) {
        this._serverSubs[channel] = {
            'offset': sub.offset,
            'epoch': sub.epoch,
            'recoverable': sub.recoverable || false
        };
        this.emit('subscribed', this._getSubscribeContext(channel, sub));
    }
    _handleDisconnect(disconnect) {
        const code = disconnect.code;
        let reconnect = true;
        if ((code >= 3500 && code < 4000) || (code >= 4500 && code < 5000)) {
            reconnect = false;
        }
        this._disconnect(code, disconnect.reason, reconnect);
    }
    _getPublicationContext(channel, pub) {
        const ctx = {
            channel: channel,
            data: pub.data
        };
        if (pub.offset) {
            ctx.offset = pub.offset;
        }
        if (pub.info) {
            ctx.info = this._getJoinLeaveContext(pub.info);
        }
        if (pub.tags) {
            ctx.tags = pub.tags;
        }
        return ctx;
    }
    _getJoinLeaveContext(clientInfo) {
        const info = {
            client: clientInfo.client,
            user: clientInfo.user
        };
        const connInfo = clientInfo['conn_info'];
        if (connInfo) {
            info.connInfo = connInfo;
        }
        const chanInfo = clientInfo['chan_info'];
        if (chanInfo) {
            info.chanInfo = chanInfo;
        }
        return info;
    }
    _handlePublication(channel, pub, id) {
        const sub = this._getSub(channel, id);
        if (!sub && channel) {
            if (this._isServerSub(channel)) {
                const ctx = this._getPublicationContext(channel, pub);
                this.emit('publication', ctx);
                if (pub.offset !== undefined) {
                    this._serverSubs[channel].offset = pub.offset;
                }
            }
            return;
        }
        // @ts-ignore – we are hiding some symbols from public API autocompletion.
        sub._handlePublication(pub);
    }
    _handleMessage(message) {
        this.emit('message', { data: message.data });
    }
    _handleServerPing(next) {
        if (this._sendPong) {
            const cmd = {};
            this._transportSendCommands([cmd]);
        }
        next();
    }
    _handlePush(data, next) {
        const channel = data.channel;
        const id = data.id;
        if (data.pub) {
            this._handlePublication(channel, data.pub, id);
        }
        else if (data.message) {
            this._handleMessage(data.message);
        }
        else if (data.join) {
            this._handleJoin(channel, data.join, id);
        }
        else if (data.leave) {
            this._handleLeave(channel, data.leave, id);
        }
        else if (data.unsubscribe) {
            this._handleUnsubscribe(channel, data.unsubscribe);
        }
        else if (data.subscribe) {
            this._handleSubscribe(channel, data.subscribe);
        }
        else if (data.disconnect) {
            this._handleDisconnect(data.disconnect);
        }
        next();
    }
    _flush() {
        const commands = this._commands.slice(0);
        this._commands = [];
        this._transportSendCommands(commands);
    }
    _createErrorObject(code, message, temporary) {
        const errObject = {
            code: code,
            message: message
        };
        if (temporary) {
            errObject.temporary = true;
        }
        return errObject;
    }
    _registerCall(id, callback, errback) {
        this._callbacks[id] = {
            callback: callback,
            errback: errback,
            timeout: null
        };
        this._callbacks[id].timeout = setTimeout(() => {
            delete this._callbacks[id];
            if (isFunction(errback)) {
                errback({ error: this._createErrorObject(errorCodes.timeout, 'timeout') });
            }
        }, this._config.timeout);
    }
    _addCommand(command) {
        if (this._batching) {
            this._commands.push(command);
        }
        else {
            this._transportSendCommands([command]);
        }
    }
    _nextPromiseId() {
        return ++this._promiseId;
    }
    _nextTransportId() {
        return ++this._transportId;
    }
    _resolvePromises() {
        for (const id in this._promises) {
            if (!this._promises.hasOwnProperty(id)) {
                continue;
            }
            if (this._promises[id].timeout) {
                clearTimeout(this._promises[id].timeout);
            }
            this._promises[id].resolve();
            delete this._promises[id];
        }
    }
    _rejectPromises(err) {
        for (const id in this._promises) {
            if (!this._promises.hasOwnProperty(id)) {
                continue;
            }
            if (this._promises[id].timeout) {
                clearTimeout(this._promises[id].timeout);
            }
            this._promises[id].reject(err);
            delete this._promises[id];
        }
    }
}
Centrifuge.SubscriptionState = SubscriptionState;
Centrifuge.State = State;
Centrifuge.UnauthorizedError = UnauthorizedError;

export { Centrifuge, State, Subscription, SubscriptionState, UnauthorizedError, connectingCodes, disconnectedCodes, errorCodes, subscribingCodes, subscriptionFlags, unsubscribedCodes };
