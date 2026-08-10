var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/react@19.2.1/node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/.pnpm/react@19.2.1/node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info2) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info2[0],
              info2[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error2) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error2);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c2) {
            return c2;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                null != _ioInfo && (_ioInfo.end = performance.now());
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error2) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error2;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now());
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error2);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error2) {
              ReactSharedInternals.thrownErrors.push(error2);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error2) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error2);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error2) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error2 && null !== error2 && "string" === typeof error2.message ? String(error2.message) : String(error2),
            error: error2
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error2);
          return;
        }
        console.error(error2);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error2) {
          ReactSharedInternals.thrownErrors.push(error2);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error2) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error2 = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error2)) : reject(error2);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error2) {
          reportGlobalError(error2);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.1";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/.pnpm/react@19.2.1/node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/.pnpm/react@19.2.1/node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// node_modules/.pnpm/react-dom@19.2.1_react@19.2.1/node_modules/react-dom/cjs/react-dom.development.js
var require_react_dom_development = __commonJS({
  "node_modules/.pnpm/react-dom@19.2.1_react@19.2.1/node_modules/react-dom/cjs/react-dom.development.js"(exports) {
    "use strict";
    (function() {
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        try {
          testStringCoercion(key);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        JSCompiler_inline_result && (console.error(
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"
        ), testStringCoercion(key));
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: null == key ? null : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input)
          return "use-credentials" === input ? input : "";
      }
      function getValueDescriptorExpectingObjectForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : 'something with type "' + typeof thing + '"';
      }
      function getValueDescriptorExpectingEnumForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "string" === typeof thing ? JSON.stringify(thing) : "number" === typeof thing ? "`" + thing + "`" : 'something with type "' + typeof thing + '"';
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require_react(), Internals = {
        d: {
          f: noop,
          r: function() {
            throw Error(
              "Invalid form element. requestFormReset must be passed a form that was rendered by React."
            );
          },
          D: noop,
          C: noop,
          L: noop,
          m: noop,
          X: noop,
          S: noop,
          M: noop
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      "function" === typeof Map && null != Map.prototype && "function" === typeof Map.prototype.forEach && "function" === typeof Set && null != Set.prototype && "function" === typeof Set.prototype.clear && "function" === typeof Set.prototype.forEach || console.error(
        "React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills"
      );
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.createPortal = function(children, container2) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container2 || 1 !== container2.nodeType && 9 !== container2.nodeType && 11 !== container2.nodeType)
          throw Error("Target container is not a DOM element.");
        return createPortal$1(children, container2, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn)
            return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f() && console.error(
            "flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering. Consider moving this call to a scheduler task or micro task."
          );
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && href ? null != options && "object" !== typeof options ? console.error(
          "ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : null != options && "string" !== typeof options.crossOrigin && console.error(
          "ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.",
          getValueDescriptorExpectingObjectForWarning(options.crossOrigin)
        ) : console.error(
          "ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        if ("string" !== typeof href || !href)
          console.error(
            "ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
            getValueDescriptorExpectingObjectForWarning(href)
          );
        else if (1 < arguments.length) {
          var options = arguments[1];
          "object" === typeof options && options.hasOwnProperty("crossOrigin") ? console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          ) : console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          );
        }
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        "string" === typeof href && href ? null == options || "object" !== typeof options ? console.error(
          "ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : "style" !== options.as && "script" !== options.as && console.error(
          'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are "style" and "script".',
          getValueDescriptorExpectingEnumForWarning(options.as)
        ) : console.error(
          "ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(
            href,
            "string" === typeof options.precedence ? options.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "script" !== options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingEnumForWarning(options.as) + ".");
        if (encountered)
          console.error(
            "ReactDOM.preinitModule(): Expected up to two arguments, a non-empty `href` string and, optionally, an `options` object with a valid `as` property.%s",
            encountered
          );
        else
          switch (encountered = options && "string" === typeof options.as ? options.as : "script", encountered) {
            case "script":
              break;
            default:
              encountered = getValueDescriptorExpectingEnumForWarning(encountered), console.error(
                'ReactDOM.preinitModule(): Currently the only supported "as" type for this function is "script" but received "%s" instead. This warning was generated for `href` "%s". In the future other module types will be supported, aligning with the import-attributes proposal. Learn more here: (https://github.com/tc39/proposal-import-attributes)',
                encountered,
                href
              );
          }
        if ("string" === typeof href)
          if ("object" === typeof options && null !== options) {
            if (null == options.as || "script" === options.as)
              encountered = getCrossOriginStringAs(
                options.as,
                options.crossOrigin
              ), Internals.d.M(href, {
                crossOrigin: encountered,
                integrity: "string" === typeof options.integrity ? options.integrity : void 0,
                nonce: "string" === typeof options.nonce ? options.nonce : void 0
              });
          } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        null == options || "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : "string" === typeof options.as && options.as || (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel="preload" as="..." />` tag.%s',
          encountered
        );
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          encountered = options.as;
          var crossOrigin = getCrossOriginStringAs(
            encountered,
            options.crossOrigin
          );
          Internals.d.L(href, encountered, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "string" !== typeof options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preloadModule(): Expected two arguments, a non-empty `href` string and, optionally, an `options` object with an `as` property valid for a `<link rel="modulepreload" as="..." />` tag.%s',
          encountered
        );
        "string" === typeof href && (options ? (encountered = getCrossOriginStringAs(
          options.as,
          options.crossOrigin
        ), Internals.d.m(href, {
          as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
          crossOrigin: encountered,
          integrity: "string" === typeof options.integrity ? options.integrity : void 0
        })) : Internals.d.m(href));
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a2) {
        return fn(a2);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return resolveDispatcher().useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return resolveDispatcher().useHostTransitionStatus();
      };
      exports.version = "19.2.1";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/.pnpm/react-dom@19.2.1_react@19.2.1/node_modules/react-dom/index.js
var require_react_dom = __commonJS({
  "node_modules/.pnpm/react-dom@19.2.1_react@19.2.1/node_modules/react-dom/index.js"(exports, module) {
    "use strict";
    if (false) {
      checkDCE();
      module.exports = null;
    } else {
      module.exports = require_react_dom_development();
    }
  }
});

// node_modules/.pnpm/react@19.2.1/node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/.pnpm/react@19.2.1/node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    (function() {
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                validateChildKeys(children[isStaticChildren]);
              Object.freeze && Object.freeze(children);
            } else
              console.error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
          children = getComponentNameFromType(type);
          var keys = Object.keys(config).filter(function(k) {
            return "key" !== k;
          });
          isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
          didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ), didWarnAboutKeySpread[children + isStaticChildren] = true);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(
          maybeKey,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        return ReactElement(
          type,
          children,
          maybeKey,
          getOwner(),
          debugStack,
          debugTask
        );
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      var React = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      React = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(
        React,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutKeySpread = {};
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          false,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.jsxs = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          true,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
    })();
  }
});

// node_modules/.pnpm/react@19.2.1/node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/.pnpm/react@19.2.1/node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// node_modules/.pnpm/remotion@4.0.468_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/remotion/dist/esm/index.mjs
var import_react = __toESM(require_react(), 1);
var import_react2 = __toESM(require_react(), 1);
var import_react_dom = __toESM(require_react_dom(), 1);
var import_react3 = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var import_react4 = __toESM(require_react(), 1);
var import_react5 = __toESM(require_react(), 1);
var import_react6 = __toESM(require_react(), 1);
var import_react7 = __toESM(require_react(), 1);
var import_react8 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var import_react9 = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var import_react10 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var import_react11 = __toESM(require_react(), 1);
var import_react12 = __toESM(require_react(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var import_react13 = __toESM(require_react(), 1);
var import_react14 = __toESM(require_react(), 1);
var import_react15 = __toESM(require_react(), 1);
var import_react16 = __toESM(require_react(), 1);
var React6 = __toESM(require_react(), 1);
var import_react17 = __toESM(require_react(), 1);
var import_react18 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var import_react19 = __toESM(require_react(), 1);
var import_react20 = __toESM(require_react(), 1);
var import_react21 = __toESM(require_react(), 1);
var import_react22 = __toESM(require_react(), 1);
var import_react23 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var import_react24 = __toESM(require_react(), 1);
var import_react25 = __toESM(require_react(), 1);
var import_react26 = __toESM(require_react(), 1);
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var import_react27 = __toESM(require_react(), 1);
var import_react28 = __toESM(require_react(), 1);
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var import_react29 = __toESM(require_react(), 1);
var import_react30 = __toESM(require_react(), 1);
var import_react31 = __toESM(require_react(), 1);
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var import_react32 = __toESM(require_react(), 1);
var import_react33 = __toESM(require_react(), 1);
var import_react34 = __toESM(require_react(), 1);
var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
var import_react35 = __toESM(require_react(), 1);
var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
var import_react36 = __toESM(require_react(), 1);
var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
var import_react37 = __toESM(require_react(), 1);
var import_react38 = __toESM(require_react(), 1);
var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
var import_react39 = __toESM(require_react(), 1);
var import_react40 = __toESM(require_react(), 1);
var import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
var import_react41 = __toESM(require_react(), 1);
var import_react42 = __toESM(require_react(), 1);
var import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
var import_react43 = __toESM(require_react(), 1);
var import_jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
var import_react44 = __toESM(require_react(), 1);
var import_react45 = __toESM(require_react(), 1);
var import_react46 = __toESM(require_react(), 1);
var import_react47 = __toESM(require_react(), 1);
var import_react48 = __toESM(require_react(), 1);
var import_jsx_runtime20 = __toESM(require_jsx_runtime(), 1);
var import_react49 = __toESM(require_react(), 1);
var import_react50 = __toESM(require_react(), 1);
var import_react51 = __toESM(require_react(), 1);
var import_react52 = __toESM(require_react(), 1);
var import_react53 = __toESM(require_react(), 1);
var import_react54 = __toESM(require_react(), 1);
var import_react55 = __toESM(require_react(), 1);
var import_jsx_runtime21 = __toESM(require_jsx_runtime(), 1);
var import_react56 = __toESM(require_react(), 1);
var import_react57 = __toESM(require_react(), 1);
var import_react58 = __toESM(require_react(), 1);
var import_react59 = __toESM(require_react(), 1);
var import_react60 = __toESM(require_react(), 1);
var import_jsx_runtime22 = __toESM(require_jsx_runtime(), 1);
var import_react61 = __toESM(require_react(), 1);
var import_jsx_runtime23 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime24 = __toESM(require_jsx_runtime(), 1);
var import_react62 = __toESM(require_react(), 1);
var import_react63 = __toESM(require_react(), 1);
var import_jsx_runtime25 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime26 = __toESM(require_jsx_runtime(), 1);
var import_react64 = __toESM(require_react(), 1);
var import_jsx_runtime27 = __toESM(require_jsx_runtime(), 1);
var import_react65 = __toESM(require_react(), 1);
var import_react66 = __toESM(require_react(), 1);
var import_react67 = __toESM(require_react(), 1);
var import_jsx_runtime28 = __toESM(require_jsx_runtime(), 1);
var import_react68 = __toESM(require_react(), 1);
var import_react69 = __toESM(require_react(), 1);
var import_react70 = __toESM(require_react(), 1);
var import_jsx_runtime29 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime30 = __toESM(require_jsx_runtime(), 1);
var import_react71 = __toESM(require_react(), 1);
var import_react72 = __toESM(require_react(), 1);
var import_react73 = __toESM(require_react(), 1);
var import_react74 = __toESM(require_react(), 1);
var import_jsx_runtime31 = __toESM(require_jsx_runtime(), 1);
var import_react75 = __toESM(require_react(), 1);
var import_react76 = __toESM(require_react(), 1);
var import_jsx_runtime32 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime33 = __toESM(require_jsx_runtime(), 1);
var import_react77 = __toESM(require_react(), 1);
var import_jsx_runtime34 = __toESM(require_jsx_runtime(), 1);
var import_react78 = __toESM(require_react(), 1);
var import_react79 = __toESM(require_react(), 1);
var import_react80 = __toESM(require_react(), 1);
var import_jsx_runtime35 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime36 = __toESM(require_jsx_runtime(), 1);
var import_react81 = __toESM(require_react(), 1);
var import_react82 = __toESM(require_react(), 1);
var import_react83 = __toESM(require_react(), 1);
var import_jsx_runtime37 = __toESM(require_jsx_runtime(), 1);
var import_jsx_runtime38 = __toESM(require_jsx_runtime(), 1);
var __defProp2 = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
if (typeof import_react.createContext !== "function") {
  const err = [
    'Remotion requires React.createContext, but it is "undefined".',
    'If you are in a React Server Component, turn it into a client component by adding "use client" at the top of the file.',
    "",
    "Before:",
    '  import {useCurrentFrame} from "remotion";',
    "",
    "After:",
    '  "use client";',
    '  import {useCurrentFrame} from "remotion";'
  ];
  throw new Error(err.join(`
`));
}
var CanUseRemotionHooks = (0, import_react3.createContext)(false);
var CanUseRemotionHooksProvider = ({ children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanUseRemotionHooks.Provider, {
    value: true,
    children
  });
};
var CompositionRenderErrorContext = (0, import_react4.createContext)({
  setError: () => {
  },
  clearError: () => {
  }
});
var getHot = () => {
  try {
    if (typeof __webpack_module__ === "undefined") {
      return null;
    }
    return __webpack_module__.hot ?? null;
  } catch {
    return null;
  }
};
var CompositionErrorBoundary = class extends import_react5.default.Component {
  state = { hasError: false };
  hmrStatusHandler = null;
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error2) {
    this.props.onError(error2);
    this.subscribeToHmrReset();
  }
  componentDidMount() {
    if (!this.state.hasError) {
      this.props.onClear();
    }
  }
  componentDidUpdate(_prevProps, prevState) {
    if (prevState.hasError && !this.state.hasError) {
      this.props.onClear();
    }
  }
  componentWillUnmount() {
    this.unsubscribeFromHmrReset();
  }
  subscribeToHmrReset() {
    if (this.hmrStatusHandler) {
      return;
    }
    const hot = getHot();
    if (!hot) {
      return;
    }
    const handler = (status) => {
      if (status !== "idle") {
        return;
      }
      this.unsubscribeFromHmrReset();
      this.setState({ hasError: false });
    };
    this.hmrStatusHandler = handler;
    hot.addStatusHandler(handler);
  }
  unsubscribeFromHmrReset() {
    const handler = this.hmrStatusHandler;
    if (!handler) {
      return;
    }
    this.hmrStatusHandler = null;
    const hot = getHot();
    if (!hot) {
      return;
    }
    hot.removeStatusHandler(handler);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
};
var CompositionManager = (0, import_react6.createContext)({
  compositions: [],
  folders: [],
  currentCompositionMetadata: null,
  canvasContent: null
});
var CompositionSetters = (0, import_react6.createContext)({
  registerComposition: () => {
    return;
  },
  unregisterComposition: () => {
    return;
  },
  registerFolder: () => {
    return;
  },
  unregisterFolder: () => {
    return;
  },
  setCanvasContent: () => {
    return;
  },
  onlyRenderComposition: null
});
var NonceContext = (0, import_react8.createContext)({
  getNonce: () => 0
});
var fastRefreshNonce = 0;
try {
  if (typeof __webpack_module__ !== "undefined") {
    if (__webpack_module__.hot) {
      __webpack_module__.hot.addStatusHandler((status) => {
        if (status === "idle") {
          fastRefreshNonce++;
        }
      });
    }
  }
} catch {
}
var useNonce = () => {
  const context = (0, import_react8.useContext)(NonceContext);
  const nonce = context.getNonce();
  const nonceRef = (0, import_react8.useRef)(nonce);
  nonceRef.current = nonce;
  const history = (0, import_react8.useRef)([[fastRefreshNonce, nonce]]);
  const get = (0, import_react8.useCallback)(() => {
    if (fastRefreshNonce !== history.current[history.current.length - 1][0]) {
      history.current = [
        ...history.current,
        [fastRefreshNonce, nonceRef.current]
      ];
    }
    return history.current;
  }, [history]);
  return (0, import_react8.useMemo)(() => {
    return { get };
  }, [get]);
};
function truthy(value) {
  return Boolean(value);
}
var getRegex = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
var invalidFolderNameErrorMessage = `Folder name must match ${String(getRegex())}`;
var FolderContext = (0, import_react7.createContext)({
  folderName: null,
  parentName: null
});
function getNodeEnvString() {
  return ["NOD", "E_EN", "V"].join("");
}
var getEnvString = () => {
  return ["e", "nv"].join("");
};
var getRemotionEnvironment = () => {
  const isPlayer = typeof window !== "undefined" && window.remotion_isPlayer;
  const isRendering = typeof window !== "undefined" && typeof window.process !== "undefined" && typeof window.process.env !== "undefined" && (window.process[getEnvString()][getNodeEnvString()] === "test" || window.process[getEnvString()][getNodeEnvString()] === "production" && typeof window !== "undefined" && typeof window.remotion_puppeteerTimeout !== "undefined");
  const isStudio = typeof window !== "undefined" && window.remotion_isStudio;
  const isReadOnlyStudio = typeof window !== "undefined" && window.remotion_isReadOnlyStudio;
  return {
    isStudio,
    isRendering,
    isPlayer,
    isReadOnlyStudio,
    isClientSideRendering: false
  };
};
var DATE_TOKEN = "remotion-date:";
var FILE_TOKEN = "remotion-file:";
var serializeJSONWithSpecialTypes = ({
  data,
  indent,
  staticBase
}) => {
  let customDateUsed = false;
  let customFileUsed = false;
  let mapUsed = false;
  let setUsed = false;
  try {
    const serializedString = JSON.stringify(data, function(key, value) {
      const item = this[key];
      if (item instanceof Date) {
        customDateUsed = true;
        return `${DATE_TOKEN}${item.toISOString()}`;
      }
      if (item instanceof Map) {
        mapUsed = true;
        return value;
      }
      if (item instanceof Set) {
        setUsed = true;
        return value;
      }
      if (typeof item === "string" && staticBase !== null && item.startsWith(staticBase)) {
        customFileUsed = true;
        return `${FILE_TOKEN}${item.replace(staticBase + "/", "")}`;
      }
      return value;
    }, indent);
    return { serializedString, customDateUsed, customFileUsed, mapUsed, setUsed };
  } catch (err) {
    throw new Error("Could not serialize the passed input props to JSON: " + err.message);
  }
};
var deserializeJSONWithSpecialTypes = (data) => {
  return JSON.parse(data, (_, value) => {
    if (typeof value === "string" && value.startsWith(DATE_TOKEN)) {
      return new Date(value.replace(DATE_TOKEN, ""));
    }
    if (typeof value === "string" && value.startsWith(FILE_TOKEN)) {
      return `${window.remotion_staticBase}/${value.replace(FILE_TOKEN, "")}`;
    }
    return value;
  });
};
var serializeThenDeserialize = (props) => {
  return deserializeJSONWithSpecialTypes(serializeJSONWithSpecialTypes({
    data: props,
    indent: 2,
    staticBase: window.remotion_staticBase
  }).serializedString);
};
var serializeThenDeserializeInStudio = (props) => {
  if (getRemotionEnvironment().isStudio) {
    return serializeThenDeserialize(props);
  }
  return props;
};
var IsPlayerContext = (0, import_react9.createContext)(false);
var useIsPlayer = () => {
  return (0, import_react9.useContext)(IsPlayerContext);
};
var hasTailwindClassName = ({
  className,
  classPrefix,
  type
}) => {
  if (!className) {
    return false;
  }
  if (type === "exact") {
    const split = className.split(" ");
    return classPrefix.some((token) => {
      return split.some((part) => {
        return part.trim() === token || part.trim().endsWith(`:${token}`) || part.trim().endsWith(`!${token}`);
      });
    });
  }
  return classPrefix.some((prefix) => {
    return className.startsWith(prefix) || className.includes(` ${prefix}`) || className.includes(`!${prefix}`) || className.includes(`:${prefix}`);
  });
};
var AbsoluteFillRefForwarding = (props, ref) => {
  const { style, ...other } = props;
  const actualStyle = (0, import_react10.useMemo)(() => {
    return {
      position: "absolute",
      top: hasTailwindClassName({
        className: other.className,
        classPrefix: ["top-", "inset-"],
        type: "prefix"
      }) ? void 0 : 0,
      left: hasTailwindClassName({
        className: other.className,
        classPrefix: ["left-", "inset-"],
        type: "prefix"
      }) ? void 0 : 0,
      right: hasTailwindClassName({
        className: other.className,
        classPrefix: ["right-", "inset-"],
        type: "prefix"
      }) ? void 0 : 0,
      bottom: hasTailwindClassName({
        className: other.className,
        classPrefix: ["bottom-", "inset-"],
        type: "prefix"
      }) ? void 0 : 0,
      width: hasTailwindClassName({
        className: other.className,
        classPrefix: ["w-"],
        type: "prefix"
      }) ? void 0 : "100%",
      height: hasTailwindClassName({
        className: other.className,
        classPrefix: ["h-"],
        type: "prefix"
      }) ? void 0 : "100%",
      display: hasTailwindClassName({
        className: other.className,
        classPrefix: [
          "block",
          "inline-block",
          "inline",
          "flex",
          "inline-flex",
          "flow-root",
          "grid",
          "inline-grid",
          "contents",
          "list-item",
          "hidden"
        ],
        type: "exact"
      }) ? void 0 : "flex",
      flexDirection: hasTailwindClassName({
        className: other.className,
        classPrefix: [
          "flex-row",
          "flex-col",
          "flex-row-reverse",
          "flex-col-reverse"
        ],
        type: "exact"
      }) ? void 0 : "column",
      ...style
    };
  }, [other.className, style]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", {
    ref,
    style: actualStyle,
    ...other
  });
};
var AbsoluteFill = (0, import_react10.forwardRef)(AbsoluteFillRefForwarding);
var rotate = {
  transform: `rotate(90deg)`
};
var ICON_SIZE = 40;
var label = {
  color: "white",
  fontSize: 14,
  fontFamily: "sans-serif"
};
var container = {
  justifyContent: "center",
  alignItems: "center"
};
var Loading = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(AbsoluteFill, {
    style: container,
    id: "remotion-comp-loading",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("style", {
        type: "text/css",
        children: `
				@keyframes anim {
					from {
						opacity: 0
					}
					to {
						opacity: 1
					}
				}
				#remotion-comp-loading {
					animation: anim 2s;
					animation-fill-mode: forwards;
				}
			`
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", {
        width: ICON_SIZE,
        height: ICON_SIZE,
        viewBox: "-100 -100 400 400",
        style: rotate,
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", {
          fill: "#555",
          stroke: "#555",
          strokeWidth: "100",
          strokeLinejoin: "round",
          d: "M 2 172 a 196 100 0 0 0 195 5 A 196 240 0 0 0 100 2.259 A 196 240 0 0 0 2 172 z"
        })
      }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", {
        style: label,
        children: [
          "Resolving ",
          "<Suspense>",
          "..."
        ]
      })
    ]
  });
};
var _portalNode = null;
var portalNode = () => {
  if (!_portalNode) {
    if (typeof document === "undefined") {
      throw new Error("Tried to call an API that only works in the browser from outside the browser");
    }
    _portalNode = document.createElement("div");
    _portalNode.style.position = "absolute";
    _portalNode.style.top = "0px";
    _portalNode.style.left = "0px";
    _portalNode.style.right = "0px";
    _portalNode.style.bottom = "0px";
    _portalNode.style.width = "100%";
    _portalNode.style.height = "100%";
    _portalNode.style.display = "flex";
    _portalNode.style.flexDirection = "column";
    const containerNode = document.createElement("div");
    containerNode.style.position = "fixed";
    containerNode.style.top = "-999999px";
    containerNode.appendChild(_portalNode);
    document.body.appendChild(containerNode);
  }
  return _portalNode;
};
var getKey = () => {
  return `remotion_inputPropsOverride` + window.location.origin;
};
var getInputPropsOverride = () => {
  if (typeof localStorage === "undefined")
    return null;
  const override = localStorage.getItem(getKey());
  if (!override)
    return null;
  return JSON.parse(override);
};
var didWarnSSRImport = false;
var warnOnceSSRImport = () => {
  if (didWarnSSRImport) {
    return;
  }
  didWarnSSRImport = true;
  console.warn("Called `getInputProps()` on the server. This function is not available server-side and has returned an empty object.");
  console.warn("To hide this warning, don't call this function on the server:");
  console.warn("  typeof window === 'undefined' ? {} : getInputProps()");
};
var getInputProps = () => {
  if (typeof window === "undefined") {
    warnOnceSSRImport();
    return {};
  }
  if (getRemotionEnvironment().isPlayer) {
    throw new Error("You cannot call `getInputProps()` from a <Player>. Instead, the props are available as React props from component that you passed as `component` prop.");
  }
  const override = getInputPropsOverride();
  if (override) {
    return override;
  }
  if (typeof window === "undefined" || typeof window.remotion_inputProps === "undefined") {
    throw new Error("Cannot call `getInputProps()` - window.remotion_inputProps is not set. This API is only available if you are in the Studio, or while you are rendering server-side.");
  }
  const param = window.remotion_inputProps;
  if (!param) {
    return {};
  }
  const parsed = deserializeJSONWithSpecialTypes(param);
  return parsed;
};
var EditorPropsContext = (0, import_react12.createContext)({
  props: {},
  updateProps: () => {
    throw new Error("Not implemented");
  }
});
var timeValueRef = import_react12.default.createRef();
var RemotionEnvironmentContext = import_react14.default.createContext(null);
var useRemotionEnvironment = () => {
  const context = (0, import_react13.useContext)(RemotionEnvironmentContext);
  const [env] = (0, import_react13.useState)(() => getRemotionEnvironment());
  return context ?? env;
};
function validateDimension(amount, nameOfProp, location) {
  if (typeof amount !== "number") {
    throw new Error(`The "${nameOfProp}" prop ${location} must be a number, but you passed a value of type ${typeof amount}`);
  }
  if (isNaN(amount)) {
    throw new TypeError(`The "${nameOfProp}" prop ${location} must not be NaN, but is NaN.`);
  }
  if (!Number.isFinite(amount)) {
    throw new TypeError(`The "${nameOfProp}" prop ${location} must be finite, but is ${amount}.`);
  }
  if (amount % 1 !== 0) {
    throw new TypeError(`The "${nameOfProp}" prop ${location} must be an integer, but is ${amount}.`);
  }
  if (amount <= 0) {
    throw new TypeError(`The "${nameOfProp}" prop ${location} must be positive, but got ${amount}.`);
  }
}
function validateDurationInFrames(durationInFrames, options) {
  const { allowFloats, component } = options;
  if (typeof durationInFrames === "undefined") {
    throw new Error(`The "durationInFrames" prop ${component} is missing.`);
  }
  if (typeof durationInFrames !== "number") {
    throw new Error(`The "durationInFrames" prop ${component} must be a number, but you passed a value of type ${typeof durationInFrames}`);
  }
  if (durationInFrames <= 0) {
    throw new TypeError(`The "durationInFrames" prop ${component} must be positive, but got ${durationInFrames}.`);
  }
  if (!allowFloats && durationInFrames % 1 !== 0) {
    throw new TypeError(`The "durationInFrames" prop ${component} must be an integer, but got ${durationInFrames}.`);
  }
  if (!Number.isFinite(durationInFrames)) {
    throw new TypeError(`The "durationInFrames" prop ${component} must be finite, but got ${durationInFrames}.`);
  }
}
function validateFps(fps, location, isGif) {
  if (typeof fps !== "number") {
    throw new Error(`"fps" must be a number, but you passed a value of type ${typeof fps} ${location}`);
  }
  if (!Number.isFinite(fps)) {
    throw new Error(`"fps" must be a finite, but you passed ${fps} ${location}`);
  }
  if (isNaN(fps)) {
    throw new Error(`"fps" must not be NaN, but got ${fps} ${location}`);
  }
  if (fps <= 0) {
    throw new TypeError(`"fps" must be positive, but got ${fps} ${location}`);
  }
  if (isGif && fps > 50) {
    throw new TypeError(`The FPS for a GIF cannot be higher than 50. Use the --every-nth-frame option to lower the FPS: https://remotion.dev/docs/render-as-gif`);
  }
}
var ResolveCompositionContext = (0, import_react11.createContext)(null);
var resolveCompositionsRef = (0, import_react11.createRef)();
var needsResolution = (composition) => {
  return Boolean(composition.calculateMetadata);
};
var useResolvedVideoConfig = (preferredCompositionId) => {
  const context = (0, import_react11.useContext)(ResolveCompositionContext);
  const { props: allEditorProps } = (0, import_react11.useContext)(EditorPropsContext);
  const { compositions, canvasContent, currentCompositionMetadata } = (0, import_react11.useContext)(CompositionManager);
  const currentComposition = canvasContent?.type === "composition" ? canvasContent.compositionId : null;
  const compositionId = preferredCompositionId ?? currentComposition;
  const composition = compositions.find((c2) => c2.id === compositionId);
  const selectedEditorProps = (0, import_react11.useMemo)(() => {
    return composition ? allEditorProps[composition.id] ?? {} : {};
  }, [allEditorProps, composition]);
  const env = useRemotionEnvironment();
  return (0, import_react11.useMemo)(() => {
    if (!composition) {
      return null;
    }
    if (currentCompositionMetadata) {
      return {
        type: "success",
        result: {
          ...currentCompositionMetadata,
          id: composition.id,
          defaultProps: composition.defaultProps ?? {}
        }
      };
    }
    if (!needsResolution(composition)) {
      validateDurationInFrames(composition.durationInFrames, {
        allowFloats: false,
        component: `in <Composition id="${composition.id}">`
      });
      validateFps(composition.fps, `in <Composition id="${composition.id}">`, false);
      validateDimension(composition.width, "width", `in <Composition id="${composition.id}">`);
      validateDimension(composition.height, "height", `in <Composition id="${composition.id}">`);
      return {
        type: "success",
        result: {
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          id: composition.id,
          durationInFrames: composition.durationInFrames,
          defaultProps: composition.defaultProps ?? {},
          props: {
            ...composition.defaultProps ?? {},
            ...selectedEditorProps ?? {},
            ...typeof window === "undefined" || env.isPlayer || !window.remotion_inputProps ? {} : getInputProps() ?? {}
          },
          defaultCodec: null,
          defaultOutName: null,
          defaultVideoImageFormat: null,
          defaultPixelFormat: null,
          defaultProResProfile: null,
          defaultSampleRate: null
        }
      };
    }
    if (!context) {
      return null;
    }
    if (!context[composition.id]) {
      return null;
    }
    return context[composition.id];
  }, [
    composition,
    context,
    currentCompositionMetadata,
    selectedEditorProps,
    env.isPlayer
  ]);
};
var getErrorStackWithMessage = (error2) => {
  const stack = error2.stack ?? "";
  return stack.startsWith("Error:") ? stack : `${error2.message}
${stack}`;
};
var isErrorLike = (err) => {
  if (err instanceof Error) {
    return true;
  }
  if (err === null) {
    return false;
  }
  if (typeof err !== "object") {
    return false;
  }
  if (!("stack" in err)) {
    return false;
  }
  if (typeof err.stack !== "string") {
    return false;
  }
  if (!("message" in err)) {
    return false;
  }
  if (typeof err.message !== "string") {
    return false;
  }
  return true;
};
function cancelRenderInternal(scope, err) {
  let error2;
  if (isErrorLike(err)) {
    error2 = err;
    if (!error2.stack) {
      error2.stack = new Error(error2.message).stack;
    }
  } else if (typeof err === "string") {
    error2 = Error(err);
  } else {
    error2 = Error("Rendering was cancelled");
  }
  if (scope) {
    scope.remotion_cancelledError = getErrorStackWithMessage(error2);
  }
  throw error2;
}
function cancelRender(err) {
  return cancelRenderInternal(typeof window !== "undefined" ? window : void 0, err);
}
var logLevels = ["trace", "verbose", "info", "warn", "error"];
var getNumberForLogLevel = (level) => {
  return logLevels.indexOf(level);
};
var isEqualOrBelowLogLevel = (currentLevel, level) => {
  return getNumberForLogLevel(currentLevel) <= getNumberForLogLevel(level);
};
var transformArgs = ({
  args,
  logLevel,
  tag
}) => {
  const arr = [...args];
  if (getRemotionEnvironment().isRendering && !getRemotionEnvironment().isClientSideRendering) {
    arr.unshift(/* @__PURE__ */ Symbol.for(`__remotion_level_${logLevel}`));
  }
  if (tag && getRemotionEnvironment().isRendering && !getRemotionEnvironment().isClientSideRendering) {
    arr.unshift(/* @__PURE__ */ Symbol.for(`__remotion_tag_${tag}`));
  }
  return arr;
};
var verbose = (options, ...args) => {
  if (isEqualOrBelowLogLevel(options.logLevel, "verbose")) {
    return console.debug(...transformArgs({ args, logLevel: "verbose", tag: options.tag }));
  }
};
var trace = (options, ...args) => {
  if (isEqualOrBelowLogLevel(options.logLevel, "trace")) {
    return console.debug(...transformArgs({ args, logLevel: "trace", tag: options.tag }));
  }
};
var info = (options, ...args) => {
  if (isEqualOrBelowLogLevel(options.logLevel, "info")) {
    return console.log(...transformArgs({ args, logLevel: "info", tag: options.tag }));
  }
};
var warn = (options, ...args) => {
  if (isEqualOrBelowLogLevel(options.logLevel, "warn")) {
    return console.warn(...transformArgs({ args, logLevel: "warn", tag: options.tag }));
  }
};
var error = (options, ...args) => {
  return console.error(...transformArgs({ args, logLevel: "error", tag: options.tag }));
};
var Log = {
  trace,
  verbose,
  info,
  warn,
  error
};
if (typeof window !== "undefined") {
  window.remotion_renderReady = false;
  if (!window.remotion_delayRenderTimeouts) {
    window.remotion_delayRenderTimeouts = {};
  }
  window.remotion_delayRenderHandles = [];
}
var DELAY_RENDER_CALLSTACK_TOKEN = "The delayRender was called:";
var DELAY_RENDER_RETRIES_LEFT = "Retries left: ";
var DELAY_RENDER_RETRY_TOKEN = "- Rendering the frame will be retried.";
var DELAY_RENDER_CLEAR_TOKEN = "handle was cleared after";
var defaultTimeout = 3e4;
var delayRenderInternal = ({
  scope,
  environment,
  label: label2,
  options
}) => {
  if (typeof label2 !== "string" && label2 !== null) {
    throw new Error("The label parameter of delayRender() must be a string or undefined, got: " + JSON.stringify(label2));
  }
  const handle = Math.random();
  scope.remotion_delayRenderHandles.push(handle);
  const called = Error().stack?.replace(/^Error/g, "") ?? "";
  if (environment.isRendering) {
    const timeoutToUse = (options?.timeoutInMilliseconds ?? scope.remotion_puppeteerTimeout ?? defaultTimeout) - 2e3;
    const retriesLeft = (options?.retries ?? 0) - (scope.remotion_attempt - 1);
    scope.remotion_delayRenderTimeouts[handle] = {
      label: label2 ?? null,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        const message = [
          `A delayRender()`,
          label2 ? `"${label2}"` : null,
          `was called but not cleared after ${timeoutToUse}ms. See https://remotion.dev/docs/timeout for help.`,
          retriesLeft > 0 ? DELAY_RENDER_RETRIES_LEFT + retriesLeft : null,
          retriesLeft > 0 ? DELAY_RENDER_RETRY_TOKEN : null,
          DELAY_RENDER_CALLSTACK_TOKEN,
          called
        ].filter(truthy).join(" ");
        if (environment.isClientSideRendering) {
          scope.remotion_cancelledError = getErrorStackWithMessage(Error(message));
        } else {
          cancelRenderInternal(scope, Error(message));
        }
      }, timeoutToUse)
    };
  }
  scope.remotion_renderReady = false;
  return handle;
};
var delayRender = (label2, options) => {
  if (typeof window === "undefined") {
    return Math.random();
  }
  return delayRenderInternal({
    scope: window,
    environment: getRemotionEnvironment(),
    label: label2 ?? null,
    options: options ?? {}
  });
};
var continueRenderInternal = ({
  scope,
  handle,
  environment,
  logLevel
}) => {
  if (typeof handle === "undefined") {
    throw new TypeError("The continueRender() method must be called with a parameter that is the return value of delayRender(). No value was passed.");
  }
  if (typeof handle !== "number") {
    throw new TypeError("The parameter passed into continueRender() must be the return value of delayRender() which is a number. Got: " + JSON.stringify(handle));
  }
  scope.remotion_delayRenderHandles = scope.remotion_delayRenderHandles.filter((h) => {
    if (h === handle) {
      if (environment.isRendering && scope !== void 0) {
        if (!scope.remotion_delayRenderTimeouts[handle]) {
          return false;
        }
        const { label: label2, startTime, timeout } = scope.remotion_delayRenderTimeouts[handle];
        clearTimeout(timeout);
        const message = [
          label2 ? `"${label2}"` : "A handle",
          DELAY_RENDER_CLEAR_TOKEN,
          `${Date.now() - startTime}ms`
        ].filter(truthy).join(" ");
        Log.verbose({ logLevel, tag: "delayRender()" }, message);
        delete scope.remotion_delayRenderTimeouts[handle];
      }
      return false;
    }
    return true;
  });
  if (scope.remotion_delayRenderHandles.length === 0) {
    scope.remotion_renderReady = true;
  }
};
var LogLevelContext = (0, import_react16.createContext)({
  logLevel: "info",
  mountTime: 0
});
var useLogLevel = () => {
  const { logLevel } = React6.useContext(LogLevelContext);
  if (logLevel === null) {
    throw new Error("useLogLevel must be used within a LogLevelProvider");
  }
  return logLevel;
};
var useMountTime = () => {
  const { mountTime } = React6.useContext(LogLevelContext);
  if (mountTime === null) {
    throw new Error("useMountTime must be used within a LogLevelProvider");
  }
  return mountTime;
};
var DelayRenderContextType = (0, import_react15.createContext)(null);
var useDelayRender = () => {
  const environment = useRemotionEnvironment();
  const scope = (0, import_react15.useContext)(DelayRenderContextType) ?? (typeof window !== "undefined" ? window : void 0);
  const logLevel = useLogLevel();
  const delayRender2 = (0, import_react15.useCallback)((label2, options) => {
    if (!scope) {
      return Math.random();
    }
    return delayRenderInternal({
      scope,
      environment,
      label: label2 ?? null,
      options: options ?? {}
    });
  }, [environment, scope]);
  const continueRender2 = (0, import_react15.useCallback)((handle) => {
    if (!scope) {
      return;
    }
    continueRenderInternal({
      scope,
      handle,
      environment,
      logLevel
    });
  }, [environment, logLevel, scope]);
  const cancelRender2 = (0, import_react15.useCallback)((err) => {
    return cancelRenderInternal(scope ?? (typeof window !== "undefined" ? window : void 0), err);
  }, [scope]);
  return { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 };
};
var useLazyComponent = ({
  compProps,
  componentName,
  noSuspense
}) => {
  const componentRef = (0, import_react17.useRef)(null);
  if ("component" in compProps) {
    componentRef.current = compProps.component;
  }
  const lazy = (0, import_react17.useMemo)(() => {
    if ("component" in compProps) {
      if (typeof document === "undefined" || noSuspense) {
        return compProps.component;
      }
      if (typeof compProps.component === "undefined") {
        throw new Error(`A value of \`undefined\` was passed to the \`component\` prop. Check the value you are passing to the <${componentName}/> component.`);
      }
      const Wrapper = (props) => {
        const Comp = componentRef.current;
        return import_react17.default.createElement(Comp, props);
      };
      return Wrapper;
    }
    if ("lazyComponent" in compProps && typeof compProps.lazyComponent !== "undefined") {
      if (typeof compProps.lazyComponent === "undefined") {
        throw new Error(`A value of \`undefined\` was passed to the \`lazyComponent\` prop. Check the value you are passing to the <${componentName}/> component.`);
      }
      return import_react17.default.lazy(compProps.lazyComponent);
    }
    throw new Error("You must pass either 'component' or 'lazyComponent'");
  }, [compProps.lazyComponent]);
  return lazy;
};
var useVideo = () => {
  const { canvasContent, compositions, currentCompositionMetadata } = (0, import_react18.useContext)(CompositionManager);
  const selected = compositions.find((c2) => {
    return canvasContent?.type === "composition" && c2.id === canvasContent.compositionId;
  });
  const resolved = useResolvedVideoConfig(selected?.id ?? null);
  return (0, import_react18.useMemo)(() => {
    if (!resolved) {
      return null;
    }
    if (resolved.type === "error") {
      return null;
    }
    if (resolved.type === "loading") {
      return null;
    }
    if (!selected) {
      return null;
    }
    return {
      ...resolved.result,
      defaultProps: selected.defaultProps ?? {},
      id: selected.id,
      ...currentCompositionMetadata ?? {},
      component: selected.component
    };
  }, [currentCompositionMetadata, resolved, selected]);
};
var getRegex2 = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
var isCompositionIdValid = (id) => id.match(getRegex2());
var validateCompositionId = (id) => {
  if (!isCompositionIdValid(id)) {
    throw new Error(`Composition id can only contain a-z, A-Z, 0-9, CJK characters and -. You passed ${id}`);
  }
};
var invalidCompositionErrorMessage = `Composition ID must match ${String(getRegex2())}`;
var validateDefaultAndInputProps = (defaultProps, name, compositionId) => {
  if (!defaultProps) {
    return;
  }
  if (typeof defaultProps !== "object") {
    throw new Error(`"${name}" must be an object, but you passed a value of type ${typeof defaultProps}`);
  }
  if (Array.isArray(defaultProps)) {
    throw new Error(`"${name}" must be an object, an array was passed ${compositionId ? `for composition "${compositionId}"` : ""}`);
  }
};
var Fallback = () => {
  const { continueRender: continueRender2, delayRender: delayRender2 } = useDelayRender();
  (0, import_react2.useEffect)(() => {
    const fallback = delayRender2("Waiting for Root component to unsuspend");
    return () => continueRender2(fallback);
  }, [continueRender2, delayRender2]);
  return null;
};
var InnerComposition = ({
  width,
  height,
  fps,
  durationInFrames,
  id,
  defaultProps,
  schema,
  ...compProps
}) => {
  const compManager = (0, import_react2.useContext)(CompositionSetters);
  const { registerComposition, unregisterComposition } = compManager;
  const video = useVideo();
  const lazy = useLazyComponent({
    compProps,
    componentName: "Composition",
    noSuspense: false
  });
  const nonce = useNonce();
  const isPlayer = useIsPlayer();
  const environment = useRemotionEnvironment();
  const canUseComposition = (0, import_react2.useContext)(CanUseRemotionHooks);
  if (typeof window !== "undefined") {
    window.remotion_seenCompositionIds = Array.from(/* @__PURE__ */ new Set([...window.remotion_seenCompositionIds ?? [], id]));
  }
  if (canUseComposition) {
    if (isPlayer) {
      throw new Error("<Composition> was mounted inside the `component` that was passed to the <Player>. See https://remotion.dev/docs/wrong-composition-mount for help.");
    }
    throw new Error("<Composition> mounted inside another composition. See https://remotion.dev/docs/wrong-composition-mount for help.");
  }
  const { folderName, parentName } = (0, import_react2.useContext)(FolderContext);
  const stack = compProps.stack ?? null;
  (0, import_react2.useEffect)(() => {
    if (!id) {
      throw new Error("No id for composition passed.");
    }
    validateCompositionId(id);
    validateDefaultAndInputProps(defaultProps, "defaultProps", id);
    registerComposition({
      durationInFrames: durationInFrames ?? void 0,
      fps: fps ?? void 0,
      height: height ?? void 0,
      width: width ?? void 0,
      id,
      folderName,
      component: lazy,
      defaultProps: serializeThenDeserializeInStudio(defaultProps ?? {}),
      nonce: nonce.get(),
      parentFolderName: parentName,
      schema: schema ?? null,
      calculateMetadata: compProps.calculateMetadata ?? null,
      stack
    });
    return () => {
      unregisterComposition(id);
    };
  }, [
    durationInFrames,
    fps,
    height,
    lazy,
    id,
    folderName,
    defaultProps,
    width,
    nonce,
    parentName,
    schema,
    compProps.calculateMetadata,
    stack,
    registerComposition,
    unregisterComposition
  ]);
  const resolved = useResolvedVideoConfig(id);
  const { setError, clearError } = (0, import_react2.useContext)(CompositionRenderErrorContext);
  const onError = (0, import_react2.useCallback)((error2) => {
    setError(error2);
  }, [setError]);
  const onClear = (0, import_react2.useCallback)(() => {
    clearError();
  }, [clearError]);
  if (environment.isStudio && video && video.component === lazy && video.id === id) {
    const Comp = lazy;
    if (resolved === null || resolved.type !== "success" && resolved.type !== "success-and-refreshing") {
      return null;
    }
    return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CanUseRemotionHooksProvider, {
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CompositionErrorBoundary, {
        onError,
        onClear,
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react2.Suspense, {
          fallback: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Loading, {}),
          children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Comp, {
            ...resolved.result.props ?? {}
          })
        })
      })
    }), portalNode());
  }
  if (environment.isRendering && video && video.component === lazy && video.id === id) {
    const Comp = lazy;
    if (resolved === null || resolved.type !== "success" && resolved.type !== "success-and-refreshing") {
      return null;
    }
    return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CanUseRemotionHooksProvider, {
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react2.Suspense, {
        fallback: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Fallback, {}),
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Comp, {
          ...resolved.result.props ?? {}
        })
      })
    }), portalNode());
  }
  return null;
};
var Composition = (props) => {
  const { onlyRenderComposition } = (0, import_react2.useContext)(CompositionSetters);
  if (onlyRenderComposition && onlyRenderComposition !== props.id) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(InnerComposition, {
    ...props
  });
};
var componentsToAddStacksTo = [];
var addSequenceStackTraces = (component) => {
  componentsToAddStacksTo.push(component);
};
var VERSION = "4.0.468";
var checkMultipleRemotionVersions = () => {
  if (typeof globalThis === "undefined") {
    return;
  }
  const set = () => {
    globalThis.remotion_imported = VERSION;
    if (typeof window !== "undefined") {
      window.remotion_imported = VERSION;
    }
  };
  const alreadyImported = globalThis.remotion_imported || typeof window !== "undefined" && window.remotion_imported;
  if (alreadyImported) {
    if (alreadyImported === VERSION) {
      return;
    }
    if (typeof alreadyImported === "string" && alreadyImported.includes("webcodecs")) {
      set();
      return;
    }
    throw new TypeError(`\u{1F6A8} Multiple versions of Remotion detected: ${[
      VERSION,
      typeof alreadyImported === "string" ? alreadyImported : "an older version"
    ].filter(truthy).join(" and ")}. This will cause things to break in an unexpected way.
Check that all your Remotion packages are on the same version. If your dependencies depend on Remotion, make them peer dependencies. You can also run \`npx remotion versions\` from your terminal to see which versions are mismatching.`);
  }
  set();
};
var SequenceContext = (0, import_react21.createContext)(null);
var exports_timeline_position_state = {};
__export(exports_timeline_position_state, {
  useTimelineSetFrame: () => useTimelineSetFrame,
  useTimelinePosition: () => useTimelinePosition,
  useTimelineContext: () => useTimelineContext,
  usePlayingState: () => usePlayingState,
  usePlaybackRate: () => usePlaybackRate,
  useAbsoluteTimelinePosition: () => useAbsoluteTimelinePosition,
  persistCurrentFrame: () => persistCurrentFrame,
  getInitialFrameState: () => getInitialFrameState,
  getFrameForComposition: () => getFrameForComposition
});
function mulberry32(a2) {
  let t = a2 + 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function hashCode(str) {
  let i = 0;
  let chr = 0;
  let hash = 0;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}
var random = (seed, dummy) => {
  if (dummy !== void 0) {
    throw new TypeError("random() takes only one argument");
  }
  if (seed === null) {
    return Math.random();
  }
  if (typeof seed === "string") {
    return mulberry32(hashCode(seed));
  }
  if (typeof seed === "number") {
    return mulberry32(seed * 1e10);
  }
  throw new Error("random() argument must be a number or a string");
};
var SetTimelineContext = (0, import_react23.createContext)({
  setFrame: () => {
    throw new Error("default");
  },
  setPlaying: () => {
    throw new Error("default");
  }
});
var TimelineContext = (0, import_react23.createContext)(null);
var PlaybackRateContext = (0, import_react23.createContext)(null);
var AbsoluteTimeContext = (0, import_react23.createContext)(null);
var makeKey = () => {
  return `remotion.time-all`;
};
var persistCurrentFrame = (time) => {
  localStorage.setItem(makeKey(), JSON.stringify(time));
};
var getInitialFrameState = () => {
  const item = localStorage.getItem(makeKey()) ?? "{}";
  const obj = JSON.parse(item);
  return obj;
};
var getFrameForComposition = (composition) => {
  const item = localStorage.getItem(makeKey()) ?? "{}";
  const obj = JSON.parse(item);
  if (obj[composition] !== void 0) {
    return Number(obj[composition]);
  }
  if (typeof window === "undefined") {
    return 0;
  }
  return window.remotion_initialFrame ?? 0;
};
var useTimelinePositionFromContext = (state) => {
  const videoConfig = useVideo();
  const env = useRemotionEnvironment();
  if (!videoConfig) {
    return typeof window === "undefined" ? 0 : window.remotion_initialFrame ?? 0;
  }
  const unclamped = state.frame[videoConfig.id] ?? (env.isPlayer ? 0 : getFrameForComposition(videoConfig.id));
  return Math.min(videoConfig.durationInFrames - 1, unclamped);
};
var useTimelineContext = () => {
  const state = (0, import_react22.useContext)(TimelineContext);
  if (state === null) {
    throw new Error("TimelineContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
  }
  return state;
};
var usePlaybackRate = () => {
  const state = (0, import_react22.useContext)(PlaybackRateContext);
  if (state === null) {
    throw new Error("PlaybackRateContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
  }
  return state;
};
var useTimelinePosition = () => {
  const state = useTimelineContext();
  return useTimelinePositionFromContext(state);
};
var useAbsoluteTimelinePosition = () => {
  const state = (0, import_react22.useContext)(AbsoluteTimeContext);
  if (state === null) {
    throw new Error("AbsoluteTimeContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
  }
  return useTimelinePositionFromContext(state);
};
var useTimelineSetFrame = () => {
  const { setFrame } = (0, import_react22.useContext)(SetTimelineContext);
  return setFrame;
};
var usePlayingState = () => {
  const { playing, imperativePlaying } = useTimelineContext();
  const { setPlaying } = (0, import_react22.useContext)(SetTimelineContext);
  return (0, import_react22.useMemo)(() => [playing, setPlaying, imperativePlaying], [imperativePlaying, playing, setPlaying]);
};
var useCurrentFrame = () => {
  const canUseRemotionHooks = (0, import_react24.useContext)(CanUseRemotionHooks);
  const env = useRemotionEnvironment();
  if (!canUseRemotionHooks) {
    if (env.isPlayer) {
      throw new Error(`useCurrentFrame can only be called inside a component that was passed to <Player>. See: https://www.remotion.dev/docs/player/examples`);
    }
    throw new Error(`useCurrentFrame() can only be called inside a component that was registered as a composition. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions`);
  }
  const frame = useTimelinePosition();
  const context = (0, import_react24.useContext)(SequenceContext);
  const contextOffset = context ? context.cumulatedFrom + context.relativeFrom : 0;
  return frame - contextOffset;
};
var useUnsafeVideoConfig = () => {
  const context = (0, import_react26.useContext)(SequenceContext);
  const ctxWidth = context?.width ?? null;
  const ctxHeight = context?.height ?? null;
  const ctxDuration = context?.durationInFrames ?? null;
  const video = useVideo();
  return (0, import_react26.useMemo)(() => {
    if (!video) {
      return null;
    }
    const {
      id,
      durationInFrames,
      fps,
      height,
      width,
      defaultProps,
      props,
      defaultCodec,
      defaultOutName,
      defaultVideoImageFormat,
      defaultPixelFormat,
      defaultProResProfile,
      defaultSampleRate
    } = video;
    return {
      id,
      width: ctxWidth ?? width,
      height: ctxHeight ?? height,
      fps,
      durationInFrames: ctxDuration ?? durationInFrames,
      defaultProps,
      props,
      defaultCodec,
      defaultOutName,
      defaultVideoImageFormat,
      defaultPixelFormat,
      defaultProResProfile,
      defaultSampleRate
    };
  }, [ctxDuration, ctxHeight, ctxWidth, video]);
};
var useVideoConfig = () => {
  const videoConfig = useUnsafeVideoConfig();
  const context = (0, import_react25.useContext)(CanUseRemotionHooks);
  const isPlayer = useIsPlayer();
  if (!videoConfig) {
    if (typeof window !== "undefined" && window.remotion_isPlayer || isPlayer) {
      throw new Error([
        "No video config found. Likely reasons:",
        "- You are probably calling useVideoConfig() from outside the component passed to <Player />. See https://www.remotion.dev/docs/player/examples for how to set up the Player correctly.",
        "- You have multiple versions of Remotion installed which causes the React context to get lost."
      ].join("-"));
    }
    throw new Error("No video config found. You are probably calling useVideoConfig() from a component which has not been registered as a <Composition />. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions for more information.");
  }
  if (!context) {
    throw new Error("Called useVideoConfig() outside a Remotion composition.");
  }
  return videoConfig;
};
var Freeze = ({
  frame: frameToFreeze,
  children,
  active = true
}) => {
  const frame = useCurrentFrame();
  const videoConfig = useVideoConfig();
  if (typeof frameToFreeze === "undefined") {
    throw new Error(`The <Freeze /> component requires a 'frame' prop, but none was passed.`);
  }
  if (typeof frameToFreeze !== "number") {
    throw new Error(`The 'frame' prop of <Freeze /> must be a number, but is of type ${typeof frameToFreeze}`);
  }
  if (Number.isNaN(frameToFreeze)) {
    throw new Error(`The 'frame' prop of <Freeze /> must be a real number, but it is NaN.`);
  }
  if (!Number.isFinite(frameToFreeze)) {
    throw new Error(`The 'frame' prop of <Freeze /> must be a finite number, but it is ${frameToFreeze}.`);
  }
  const isActive = (0, import_react20.useMemo)(() => {
    if (typeof active === "boolean") {
      return active;
    }
    if (typeof active === "function") {
      return active(frame);
    }
  }, [active, frame]);
  const timelineContext = useTimelineContext();
  const sequenceContext = (0, import_react20.useContext)(SequenceContext);
  const relativeFrom = sequenceContext?.relativeFrom ?? 0;
  const timelineValue = (0, import_react20.useMemo)(() => {
    if (!isActive) {
      return timelineContext;
    }
    return {
      ...timelineContext,
      playing: false,
      imperativePlaying: {
        current: false
      },
      frame: {
        [videoConfig.id]: frameToFreeze + relativeFrom
      }
    };
  }, [isActive, timelineContext, videoConfig.id, frameToFreeze, relativeFrom]);
  const newSequenceContext = (0, import_react20.useMemo)(() => {
    if (!sequenceContext) {
      return null;
    }
    if (!isActive) {
      return sequenceContext;
    }
    return {
      ...sequenceContext,
      cumulatedFrom: 0
    };
  }, [sequenceContext, isActive]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TimelineContext.Provider, {
    value: timelineValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(SequenceContext.Provider, {
      value: newSequenceContext,
      children
    })
  });
};
var PremountContext = (0, import_react27.createContext)({
  premountFramesRemaining: 0
});
var sequenceVisualStyleSchema = {
  "style.translate": {
    type: "translate",
    step: 1,
    default: "0px 0px",
    description: "Offset"
  },
  "style.scale": {
    type: "number",
    min: 0.05,
    max: 100,
    step: 0.01,
    default: 1,
    description: "Scale"
  },
  "style.rotate": {
    type: "rotation",
    step: 1,
    default: "0deg",
    description: "Rotation"
  },
  "style.opacity": {
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
    description: "Opacity"
  }
};
var sequencePremountSchema = {
  premountFor: {
    type: "number",
    default: 0,
    description: "Premount For",
    min: 0,
    step: 1
  },
  postmountFor: {
    type: "hidden"
  },
  styleWhilePremounted: {
    type: "hidden"
  },
  styleWhilePostmounted: {
    type: "hidden"
  }
};
var sequenceStyleSchema = {
  ...sequenceVisualStyleSchema,
  ...sequencePremountSchema
};
var hiddenField = {
  type: "boolean",
  default: false,
  description: "Hidden"
};
var sequenceSchema = {
  hidden: hiddenField,
  layout: {
    type: "enum",
    default: "absolute-fill",
    description: "Layout",
    variants: {
      "absolute-fill": sequenceStyleSchema,
      none: {}
    }
  }
};
var sequenceSchemaDefaultLayoutNone = {
  ...sequenceSchema,
  layout: {
    ...sequenceSchema.layout,
    default: "none"
  }
};
var SequenceManager = import_react28.default.createContext({
  registerSequence: () => {
    throw new Error("SequenceManagerContext not initialized");
  },
  unregisterSequence: () => {
    throw new Error("SequenceManagerContext not initialized");
  },
  sequences: []
});
var makeSequencePropsSubscriptionKey = (key) => {
  return `${key.nodePath.join(".")}.${key.sequenceKeys.join(".")}.${key.effectKeys.map((keys) => keys.join(".")).join(".")}`;
};
var VisualModeCodeValuesContext = import_react28.default.createContext({
  codeValues: {}
});
var VisualModeDragOverridesContext = import_react28.default.createContext({
  getDragOverrides: () => {
    throw new Error("VisualModeDragOverridesContext not initialized");
  },
  getEffectDragOverrides: () => {
    throw new Error("VisualModeDragOverridesContext not initialized");
  }
});
var VisualModeSettersContext = import_react28.default.createContext({
  setDragOverrides: () => {
    throw new Error("VisualModeSettersContext not initialized");
  },
  clearDragOverrides: () => {
    throw new Error("VisualModeSettersContext not initialized");
  },
  setEffectDragOverrides: () => {
    throw new Error("VisualModeSettersContext not initialized");
  },
  clearEffectDragOverrides: () => {
    throw new Error("VisualModeSettersContext not initialized");
  },
  setCodeValues: () => {
    throw new Error("VisualModeSettersContext not initialized");
  }
});
var ENABLE_V5_BREAKING_CHANGES = false;
var deleteNestedKey = (obj, keysToRemove) => {
  for (const key of keysToRemove) {
    const parts = key.split(".");
    const parents = [obj];
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = current[part];
      if (next === void 0 || next === null) {
        current = null;
        break;
      }
      current = next;
      parents.push(current);
    }
    if (current === null) {
      continue;
    }
    delete current[parts[parts.length - 1]];
    for (let i = parents.length - 1; i > 0; i--) {
      const parent = parents[i];
      if (Object.keys(parent).length === 0) {
        const parentKey = parts[i - 1];
        delete parents[i - 1][parentKey];
      } else {
        break;
      }
    }
  }
  return obj;
};
var OverrideIdsToNodePathsGettersContext = (0, import_react31.createContext)({
  overrideIdToNodePathMappings: {}
});
var OverrideIdsToNodePathsSettersContext = (0, import_react31.createContext)({
  setOverrideIdToNodePath: () => {
    throw new Error("OverrideIdsToNodePathsSettersContext not initialized");
  }
});
var mergeOverrides = ({
  descriptor,
  codeOverrides,
  dragOverrides
}) => {
  if (!codeOverrides && !dragOverrides) {
    return { params: descriptor.params, effectKey: descriptor.effectKey };
  }
  const merged = {
    ...descriptor.params
  };
  if (codeOverrides) {
    for (const [key, value] of Object.entries(codeOverrides)) {
      if (value !== void 0) {
        merged[key] = value;
      }
    }
  }
  if (dragOverrides) {
    for (const [key, value] of Object.entries(dragOverrides)) {
      merged[key] = value;
    }
  }
  return {
    params: merged,
    effectKey: descriptor.definition.calculateKey(merged)
  };
};
var extractCodeOverrides = (propStatus) => {
  if (!propStatus) {
    return null;
  }
  const out = {};
  let hasAny = false;
  for (const [key, status] of Object.entries(propStatus)) {
    if (status.canUpdate) {
      out[key] = status.codeValue;
      hasAny = true;
    }
  }
  return hasAny ? out : null;
};
var useMemoizedEffectDefinitions = (effects) => {
  const previousRef = (0, import_react30.useRef)(null);
  const definitions = effects.map((descriptor) => descriptor.definition);
  const previous = previousRef.current;
  const isSame = previous !== null && previous.length === definitions.length && previous.every((def, i) => def === definitions[i]);
  if (isSame) {
    return previous;
  }
  previousRef.current = definitions;
  return definitions;
};
var getEffectCodeValuesCtx = ({
  codeValues,
  nodePath,
  effectIndex
}) => {
  const status = codeValues[makeSequencePropsSubscriptionKey(nodePath)];
  if (!status) {
    return { type: "cannot-update-sequence", reason: "not-found" };
  }
  if (!status.canUpdate) {
    return { type: "cannot-update-sequence", reason: status.reason };
  }
  const effect = status.effects.find((e) => e.effectIndex === effectIndex);
  if (!effect) {
    return { type: "cannot-update-effect", reason: "not-found" };
  }
  if (!effect.canUpdate) {
    return { type: "cannot-update-effect", reason: effect.reason };
  }
  return { type: "can-update-effect", props: effect.props };
};
var getCodeValuesCtx = (codeValues, nodePath) => {
  const status = codeValues[makeSequencePropsSubscriptionKey(nodePath)];
  if (!status) {
    return;
  }
  if (!status.canUpdate) {
    return;
  }
  return status.props;
};
var useMemoizedEffects = ({
  effects,
  overrideId
}) => {
  const previousRef = (0, import_react30.useRef)(null);
  const { codeValues } = (0, import_react30.useContext)(VisualModeCodeValuesContext);
  const { getEffectDragOverrides } = (0, import_react30.useContext)(VisualModeDragOverridesContext);
  const { overrideIdToNodePathMappings } = (0, import_react30.useContext)(OverrideIdsToNodePathsGettersContext);
  const previous = previousRef.current;
  const nodePath = overrideId ? overrideIdToNodePathMappings[overrideId] ?? null : null;
  const resolved = effects.map((descriptor, index) => {
    if (nodePath === null) {
      return {
        descriptor,
        params: descriptor.params,
        effectKey: descriptor.effectKey
      };
    }
    const effectStatus = getEffectCodeValuesCtx({
      codeValues,
      nodePath,
      effectIndex: index
    });
    const codeOverrides = effectStatus.type === "can-update-effect" ? extractCodeOverrides(effectStatus.props) : null;
    const dragOverridesMap = getEffectDragOverrides(nodePath, index);
    const dragOverrides = Object.keys(dragOverridesMap).length === 0 ? null : dragOverridesMap;
    const { params, effectKey } = mergeOverrides({
      descriptor,
      codeOverrides,
      dragOverrides
    });
    return { descriptor, params, effectKey };
  });
  const isSame = previous !== null && previous.length === resolved.length && previous.every((p4, i) => p4.definition === resolved[i].descriptor.definition && p4.effectKey === resolved[i].effectKey);
  if (isSame) {
    return previous;
  }
  const next = resolved.map(({ descriptor, params, effectKey }) => ({
    definition: descriptor.definition,
    effectKey,
    params,
    memoized: true
  }));
  previousRef.current = next;
  return next;
};
var flattenActiveSchema = (schema, resolve) => {
  const out = {};
  for (const key of Object.keys(schema)) {
    const field = schema[key];
    if (field.type === "hidden") {
      continue;
    } else if (field.type === "enum") {
      out[key] = field;
      const current = resolve(key) ?? field.default;
      const variant = field.variants[current];
      if (variant) {
        Object.assign(out, flattenActiveSchema(variant, resolve));
      }
    } else {
      out[key] = field;
    }
  }
  return out;
};
var getFlatSchemaWithAllKeys = (schema) => {
  const out = {};
  const addKey = (key, field) => {
    if (key in out) {
      throw new Error(`Duplicate key "${key}" in schema: discriminated union variants must not share keys`);
    }
    out[key] = field;
  };
  for (const key of Object.keys(schema)) {
    const field = schema[key];
    addKey(key, field);
    if (field.type === "enum") {
      for (const variant of Object.values(field.variants)) {
        const flatVariant = getFlatSchemaWithAllKeys(variant);
        for (const variantKey of Object.keys(flatVariant)) {
          addKey(variantKey, flatVariant[variantKey]);
        }
      }
    }
  }
  return out;
};
var findPropsToDelete = ({
  schema,
  key,
  value
}) => {
  const fieldSchema = schema[key];
  if (!fieldSchema) {
    throw new Error("Key " + JSON.stringify(key) + " not found in schema");
  }
  if (typeof value !== "string") {
    throw new Error("Value must be a string, but is " + JSON.stringify(value));
  }
  if (fieldSchema.type !== "enum") {
    throw new Error("Key " + JSON.stringify(key) + " is not an enum");
  }
  const currentVariant = fieldSchema.variants[value];
  if (!currentVariant) {
    throw new Error("Value for " + JSON.stringify(key) + " must be one of " + Object.keys(fieldSchema.variants).map((v) => JSON.stringify(v)).join(", ") + ", got " + JSON.stringify(value));
  }
  const otherVariants = Object.keys(fieldSchema.variants).filter((v) => v !== value);
  const otherKeys = /* @__PURE__ */ new Set();
  for (const variant of otherVariants) {
    const otherVariant = fieldSchema.variants[variant];
    const keys = Object.keys(otherVariant);
    for (const k of keys) {
      otherKeys.add(k);
    }
  }
  return [...otherKeys];
};
var getEffectiveVisualModeValue = ({
  codeValue,
  dragOverrideValue,
  defaultValue,
  shouldResortToDefaultValueIfUndefined = false
}) => {
  if (dragOverrideValue !== void 0) {
    return dragOverrideValue;
  }
  if (codeValue.codeValue === void 0 && shouldResortToDefaultValueIfUndefined) {
    return defaultValue;
  }
  return codeValue.codeValue;
};
var findFieldInSchema = (schema, key) => {
  if (key in schema) {
    return schema[key];
  }
  for (const field of Object.values(schema)) {
    if (field.type !== "enum") {
      continue;
    }
    for (const variant of Object.values(field.variants)) {
      const found = findFieldInSchema(variant, key);
      if (found) {
        return found;
      }
    }
  }
  return;
};
var computeEffectiveSchemaValuesDotNotation = ({
  schema,
  currentValue,
  overrideValues,
  propStatus
}) => {
  const merged = {};
  const propsToDelete = /* @__PURE__ */ new Set();
  for (const key of Object.keys(currentValue)) {
    const codeValueStatus = propStatus?.[key] ?? null;
    const field = findFieldInSchema(schema, key);
    if (field?.type === "hidden") {
      continue;
    }
    const value = codeValueStatus === null || codeValueStatus.canUpdate === false ? currentValue[key] : getEffectiveVisualModeValue({
      codeValue: codeValueStatus,
      dragOverrideValue: overrideValues[key],
      defaultValue: field?.default,
      shouldResortToDefaultValueIfUndefined: false
    });
    if (value === void 0) {
      propsToDelete.add(key);
    }
    merged[key] = value;
  }
  for (const key of Object.keys(overrideValues)) {
    if (schema[key]?.type === "enum") {
      const propsToDeleteForKey = findPropsToDelete({
        schema,
        key,
        value: merged[key]
      });
      for (const propToDelete of propsToDeleteForKey) {
        propsToDelete.add(propToDelete);
      }
    }
  }
  return { merged, propsToDelete };
};
var getNestedValue = (obj, key) => {
  const parts = key.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0 || typeof current !== "object")
      return;
    current = current[part];
  }
  return current;
};
var readValuesFromProps = (props, keys) => {
  const out = {};
  for (const key of keys) {
    out[key] = getNestedValue(props, key);
  }
  return out;
};
var selectActiveKeys = (schema, values) => {
  return Object.keys(flattenActiveSchema(schema, (key) => values[key]));
};
var mergeValues = ({
  props,
  valuesDotNotation,
  schemaKeys,
  propsToDelete
}) => {
  const merged = { ...props };
  for (const key of schemaKeys) {
    const value = valuesDotNotation[key];
    const parts = key.split(".");
    if (parts.length === 1) {
      merged[key] = value;
      continue;
    }
    let current = merged;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current[part] === "object" && current[part] !== null) {
        current[part] = { ...current[part] };
      } else {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  deleteNestedKey(merged, propsToDelete);
  return merged;
};
var stackToOverrideMap = {};
var wrapInSchema = (Component, schema) => {
  const flatSchema = getFlatSchemaWithAllKeys(schema);
  const flatKeys = Object.keys(flatSchema);
  const Wrapped = (0, import_react29.forwardRef)((props, ref) => {
    const env = useRemotionEnvironment();
    if (!env.isStudio || env.isReadOnlyStudio || env.isRendering) {
      return import_react29.default.createElement(Component, {
        ...props,
        _experimentalControls: null,
        ref
      });
    }
    const { codeValues } = (0, import_react29.useContext)(VisualModeCodeValuesContext);
    const { getDragOverrides } = (0, import_react29.useContext)(VisualModeDragOverridesContext);
    const nodePathMapping = (0, import_react29.useContext)(OverrideIdsToNodePathsGettersContext);
    if (props._experimentalControls) {
      return import_react29.default.createElement(Component, {
        ...props,
        ref
      });
    }
    const [overrideId] = (0, import_react29.useState)(() => {
      const { stack } = props;
      if (!stack) {
        return String(Math.random());
      }
      const existingOverrideId = stackToOverrideMap[stack];
      if (existingOverrideId) {
        return existingOverrideId;
      }
      const newOverrideId = String(Math.random());
      stackToOverrideMap[stack] = newOverrideId;
      return newOverrideId;
    });
    const nodePath = nodePathMapping.overrideIdToNodePathMappings[overrideId] ?? null;
    const runtimeValues = flatKeys.map((k) => getNestedValue(props, k));
    const currentRuntimeValueDotNotation = (0, import_react29.useMemo)(() => readValuesFromProps(props, flatKeys), runtimeValues);
    const controls = (0, import_react29.useMemo)(() => {
      return {
        schema,
        currentRuntimeValueDotNotation,
        overrideId
      };
    }, [currentRuntimeValueDotNotation, overrideId]);
    const { merged: valuesDotNotation, propsToDelete } = (0, import_react29.useMemo)(() => {
      return computeEffectiveSchemaValuesDotNotation({
        schema,
        currentValue: currentRuntimeValueDotNotation,
        overrideValues: nodePath === null ? {} : getDragOverrides(nodePath),
        propStatus: nodePath === null ? void 0 : getCodeValuesCtx(codeValues, nodePath)
      });
    }, [
      currentRuntimeValueDotNotation,
      getDragOverrides,
      nodePath,
      codeValues
    ]);
    const activeKeys = selectActiveKeys(schema, valuesDotNotation);
    const mergedProps = mergeValues({
      props,
      valuesDotNotation,
      schemaKeys: activeKeys,
      propsToDelete
    });
    return import_react29.default.createElement(Component, {
      ...mergedProps,
      _experimentalControls: controls,
      ref
    });
  });
  Wrapped.displayName = `wrapInSchema(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};
var RegularSequenceRefForwardingFunction = ({
  from = 0,
  durationInFrames = Infinity,
  children,
  name,
  height,
  width,
  showInTimeline = true,
  hidden = false,
  _experimentalControls: controls,
  _remotionInternalEffects,
  _remotionInternalLoopDisplay: loopDisplay,
  _remotionInternalStack: stack,
  _remotionInternalDocumentationLink: documentationLink,
  _remotionInternalPremountDisplay: premountDisplay,
  _remotionInternalPostmountDisplay: postmountDisplay,
  _remotionInternalIsMedia: isMedia,
  ...other
}, ref) => {
  const { layout = "absolute-fill" } = other;
  const [id] = (0, import_react19.useState)(() => String(Math.random()));
  const parentSequence = (0, import_react19.useContext)(SequenceContext);
  const { rootId } = useTimelineContext();
  const cumulatedFrom = parentSequence ? parentSequence.cumulatedFrom + parentSequence.relativeFrom : 0;
  const nonce = useNonce();
  if (layout !== "absolute-fill" && layout !== "none") {
    throw new TypeError(`The layout prop of <Sequence /> expects either "absolute-fill" or "none", but you passed: ${layout}`);
  }
  if (layout === "none" && typeof other.style !== "undefined") {
    throw new TypeError('If layout="none", you may not pass a style. Passed: ' + JSON.stringify(other.style));
  }
  if (typeof durationInFrames !== "number") {
    throw new TypeError(`You passed to durationInFrames an argument of type ${typeof durationInFrames}, but it must be a number.`);
  }
  if (durationInFrames <= 0) {
    throw new TypeError(`durationInFrames must be positive, but got ${durationInFrames}`);
  }
  if (typeof from !== "number") {
    throw new TypeError(`You passed to the "from" props of your <Sequence> an argument of type ${typeof from}, but it must be a number.`);
  }
  if (!Number.isFinite(from)) {
    throw new TypeError(`The "from" prop of a sequence must be finite, but got ${from}.`);
  }
  const absoluteFrame = useTimelinePosition();
  const videoConfig = useVideoConfig();
  const parentSequenceDuration = parentSequence ? Math.min(parentSequence.durationInFrames - from, durationInFrames) : durationInFrames;
  const actualDurationInFrames = Math.max(0, Math.min(videoConfig.durationInFrames - from, parentSequenceDuration));
  const { registerSequence, unregisterSequence } = (0, import_react19.useContext)(SequenceManager);
  const premounting = (0, import_react19.useMemo)(() => {
    return parentSequence?.premounting || Boolean(other._remotionInternalIsPremounting);
  }, [other._remotionInternalIsPremounting, parentSequence?.premounting]);
  const postmounting = (0, import_react19.useMemo)(() => {
    return parentSequence?.postmounting || Boolean(other._remotionInternalIsPostmounting);
  }, [other._remotionInternalIsPostmounting, parentSequence?.postmounting]);
  const currentSequenceStart = cumulatedFrom + from;
  const parentSequenceStart = parentSequence ? parentSequence.cumulatedFrom + parentSequence.relativeFrom : 0;
  const parentFirstFrame = parentSequence ? parentSequenceStart - parentSequence.cumulatedNegativeFrom : 0;
  const firstFrame = Math.max(0, parentFirstFrame, currentSequenceStart);
  const cumulatedNegativeFrom = currentSequenceStart - firstFrame;
  const contextValue = (0, import_react19.useMemo)(() => {
    return {
      cumulatedFrom,
      relativeFrom: from,
      cumulatedNegativeFrom,
      durationInFrames: actualDurationInFrames,
      parentFrom: parentSequence?.relativeFrom ?? 0,
      id,
      height: height ?? parentSequence?.height ?? null,
      width: width ?? parentSequence?.width ?? null,
      premounting,
      postmounting,
      premountDisplay: premountDisplay ?? null,
      postmountDisplay: postmountDisplay ?? null
    };
  }, [
    cumulatedFrom,
    from,
    actualDurationInFrames,
    parentSequence,
    id,
    height,
    width,
    premounting,
    postmounting,
    premountDisplay,
    postmountDisplay,
    cumulatedNegativeFrom
  ]);
  const timelineClipName = (0, import_react19.useMemo)(() => {
    return name ?? "";
  }, [name]);
  const resolvedDocumentationLink = documentationLink ?? (name === void 0 ? "https://www.remotion.dev/docs/sequence" : null);
  const env = useRemotionEnvironment();
  const inheritedStack = other?.stack ?? null;
  const stackRef = (0, import_react19.useRef)(null);
  stackRef.current = stack ?? inheritedStack;
  (0, import_react19.useEffect)(() => {
    if (!env.isStudio) {
      return;
    }
    if (isMedia) {
      if (isMedia.type === "image") {
        registerSequence({
          type: "image",
          controls: controls ?? null,
          effects: _remotionInternalEffects ?? [],
          displayName: timelineClipName,
          documentationLink: resolvedDocumentationLink,
          duration: actualDurationInFrames,
          from,
          id,
          loopDisplay,
          nonce: nonce.get(),
          parent: parentSequence?.id ?? null,
          postmountDisplay: postmountDisplay ?? null,
          premountDisplay: premountDisplay ?? null,
          rootId,
          showInTimeline,
          src: isMedia.src,
          getStack: () => stackRef.current
        });
      } else {
        registerSequence({
          type: isMedia.type,
          controls: controls ?? null,
          effects: _remotionInternalEffects ?? [],
          displayName: timelineClipName,
          documentationLink: resolvedDocumentationLink,
          doesVolumeChange: isMedia.data.doesVolumeChange,
          duration: actualDurationInFrames,
          from,
          id,
          loopDisplay,
          nonce: nonce.get(),
          parent: parentSequence?.id ?? null,
          playbackRate: isMedia.data.playbackRate,
          postmountDisplay: postmountDisplay ?? null,
          premountDisplay: premountDisplay ?? null,
          rootId,
          showInTimeline,
          src: isMedia.data.src,
          getStack: () => stackRef.current,
          startMediaFrom: isMedia.data.startMediaFrom,
          volume: isMedia.data.volumes
        });
      }
      return () => {
        unregisterSequence(id);
      };
    }
    registerSequence({
      from,
      duration: actualDurationInFrames,
      id,
      displayName: timelineClipName,
      documentationLink: resolvedDocumentationLink,
      parent: parentSequence?.id ?? null,
      type: "sequence",
      rootId,
      showInTimeline,
      nonce: nonce.get(),
      loopDisplay,
      getStack: () => stackRef.current,
      premountDisplay: premountDisplay ?? null,
      postmountDisplay: postmountDisplay ?? null,
      controls: controls ?? null,
      effects: _remotionInternalEffects ?? []
    });
    return () => {
      unregisterSequence(id);
    };
  }, [
    durationInFrames,
    id,
    name,
    registerSequence,
    timelineClipName,
    unregisterSequence,
    parentSequence?.id,
    actualDurationInFrames,
    rootId,
    from,
    showInTimeline,
    nonce,
    loopDisplay,
    premountDisplay,
    postmountDisplay,
    env.isStudio,
    controls,
    _remotionInternalEffects,
    isMedia,
    resolvedDocumentationLink
  ]);
  const endThreshold = Math.ceil(cumulatedFrom + from + durationInFrames - 1);
  const content = absoluteFrame < cumulatedFrom + from ? null : absoluteFrame > endThreshold ? null : children;
  const styleIfThere = other.layout === "none" ? void 0 : other.style;
  const defaultStyle = (0, import_react19.useMemo)(() => {
    return {
      flexDirection: void 0,
      ...width ? { width } : {},
      ...height ? { height } : {},
      ...styleIfThere ?? {}
    };
  }, [height, styleIfThere, width]);
  if (ref !== null && layout === "none") {
    throw new TypeError('It is not supported to pass both a `ref` and `layout="none"` to <Sequence />.');
  }
  if (hidden) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SequenceContext.Provider, {
    value: contextValue,
    children: content === null ? null : other.layout === "none" ? content : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AbsoluteFill, {
      ref,
      style: defaultStyle,
      className: other.className,
      children: content
    })
  });
};
var RegularSequence = (0, import_react19.forwardRef)(RegularSequenceRefForwardingFunction);
var PremountedPostmountedSequenceRefForwardingFunction = (props, ref) => {
  const parentPremountContext = (0, import_react19.useContext)(PremountContext);
  const frame = useCurrentFrame() - parentPremountContext.premountFramesRemaining;
  if (props.layout === "none") {
    throw new Error('`<Sequence>` with `premountFor` and `postmountFor` props does not support layout="none"');
  }
  const {
    style: passedStyle,
    from = 0,
    durationInFrames = Infinity,
    premountFor = 0,
    postmountFor = 0,
    styleWhilePremounted,
    styleWhilePostmounted,
    ...otherProps
  } = props;
  const endThreshold = Math.ceil(from + durationInFrames - 1);
  const premountingActive = frame < from && frame >= from - premountFor;
  const postmountingActive = frame > endThreshold && frame <= endThreshold + postmountFor;
  const freezeFrame = premountingActive ? from : postmountingActive ? from + durationInFrames - 1 : 0;
  const isFreezingActive = premountingActive || postmountingActive;
  const style = (0, import_react19.useMemo)(() => {
    return {
      ...passedStyle,
      opacity: premountingActive || postmountingActive ? 0 : 1,
      pointerEvents: premountingActive || postmountingActive ? "none" : passedStyle?.pointerEvents ?? void 0,
      ...premountingActive ? styleWhilePremounted : {},
      ...postmountingActive ? styleWhilePostmounted : {}
    };
  }, [
    passedStyle,
    premountingActive,
    postmountingActive,
    styleWhilePremounted,
    styleWhilePostmounted
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Freeze, {
    frame: freezeFrame,
    active: isFreezingActive,
    children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SequenceInner, {
      ref,
      from,
      durationInFrames,
      style,
      _remotionInternalPremountDisplay: premountFor,
      _remotionInternalPostmountDisplay: postmountFor,
      _remotionInternalIsPremounting: premountingActive,
      _remotionInternalIsPostmounting: postmountingActive,
      ...otherProps
    })
  });
};
var PremountedPostmountedSequence = (0, import_react19.forwardRef)(PremountedPostmountedSequenceRefForwardingFunction);
var SequenceRefForwardingFunction = (props, ref) => {
  const env = useRemotionEnvironment();
  const { fps } = useVideoConfig();
  if (props.layout !== "none" && !env.isRendering) {
    const effectivePremountFor = ENABLE_V5_BREAKING_CHANGES ? props.premountFor ?? fps : props.premountFor;
    if (effectivePremountFor || props.postmountFor) {
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PremountedPostmountedSequence, {
        ref,
        ...props,
        premountFor: effectivePremountFor
      });
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RegularSequence, {
    ...props,
    ref
  });
};
var SequenceInner = (0, import_react19.forwardRef)(SequenceRefForwardingFunction);
var Sequence = wrapInSchema(SequenceInner, sequenceSchema);
var calculateImageFit = (fit, imageSize, canvasSize) => {
  switch (fit) {
    case "fill": {
      return [
        0,
        0,
        imageSize.width,
        imageSize.height,
        0,
        0,
        canvasSize.width,
        canvasSize.height
      ];
    }
    case "contain": {
      const ratio = Math.min(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height);
      const centerX = (canvasSize.width - imageSize.width * ratio) / 2;
      const centerY = (canvasSize.height - imageSize.height * ratio) / 2;
      return [
        0,
        0,
        imageSize.width,
        imageSize.height,
        centerX,
        centerY,
        imageSize.width * ratio,
        imageSize.height * ratio
      ];
    }
    case "cover": {
      const ratio = Math.max(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height);
      const centerX = (canvasSize.width - imageSize.width * ratio) / 2;
      const centerY = (canvasSize.height - imageSize.height * ratio) / 2;
      return [
        0,
        0,
        imageSize.width,
        imageSize.height,
        centerX,
        centerY,
        imageSize.width * ratio,
        imageSize.height * ratio
      ];
    }
    default:
      throw new Error("Unknown fit: " + fit);
  }
};
var WEBGL_CONTEXT_DOCS_URL = "https://remotion.dev/docs/troubleshooting/webgl2-context";
var webGlContextErrorMessage = (versionLabel, effectName) => `Failed to acquire ${versionLabel} context for ${effectName}. Pass --gl=angle when using the CLI, set chromiumOptions: { gl: "angle" } when using SSR APIs, or set "OpenGL render backend" to "angle" in the Advanced section when rendering in the Studio. See ${WEBGL_CONTEXT_DOCS_URL}`;
var createWebGL2ContextError = (effectName) => new Error(webGlContextErrorMessage("WebGL2", effectName));
var CanvasPool = class {
  width;
  height;
  pairs = /* @__PURE__ */ new Map();
  lostContexts = /* @__PURE__ */ new Set();
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  getPair(backend) {
    const existing = this.pairs.get(backend);
    if (existing) {
      return existing;
    }
    const pair = [
      this.allocateCanvas(backend),
      this.allocateCanvas(backend)
    ];
    this.pairs.set(backend, pair);
    return pair;
  }
  assertContextNotLost(canvas) {
    if (this.lostContexts.has(canvas)) {
      throw new Error("WebGL context was lost during canvas effect rendering. This typically happens in headless or memory-constrained environments (e.g. Remotion Lambda). Try reducing concurrency or increasing the Lambda function memory.");
    }
  }
  allocateCanvas(backend) {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    switch (backend) {
      case "2d": {
        const ctx = canvas.getContext("2d", {
          colorSpace: "srgb"
        });
        if (!ctx) {
          throw new Error("Failed to acquire 2D context for canvas effect");
        }
        return canvas;
      }
      case "webgl2": {
        const ctx = canvas.getContext("webgl2", {
          premultipliedAlpha: true,
          alpha: true,
          preserveDrawingBuffer: true
        });
        if (!ctx) {
          throw createWebGL2ContextError("canvas effect");
        }
        canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          this.lostContexts.add(canvas);
        });
        canvas.addEventListener("webglcontextrestored", () => {
          this.lostContexts.delete(canvas);
        });
        ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        return canvas;
      }
      case "webgpu": {
        if (typeof navigator === "undefined" || !("gpu" in navigator)) {
          throw new Error("WebGPU is not available in this environment for canvas effect");
        }
        return canvas;
      }
      default: {
        const exhaustive = backend;
        throw new Error(`Unknown effect backend: ${exhaustive}`);
      }
    }
  }
};
var groupByBackend = (effects) => {
  const runs = [];
  let current = [];
  let currentBackend = null;
  for (const eff of effects) {
    const { backend } = eff.definition;
    if (currentBackend === null || backend === currentBackend) {
      current.push(eff);
      currentBackend = backend;
    } else {
      runs.push({ backend: currentBackend, effects: current });
      current = [eff];
      currentBackend = backend;
    }
  }
  if (currentBackend !== null && current.length > 0) {
    runs.push({ backend: currentBackend, effects: current });
  }
  return runs;
};
var devicePromise = null;
var getGpuDevice = () => {
  if (devicePromise) {
    return devicePromise;
  }
  devicePromise = (async () => {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      throw new Error("WebGPU is not available in this environment");
    }
    const { gpu } = navigator;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No WebGPU adapter available");
    }
    return adapter.requestDevice();
  })();
  return devicePromise;
};
var createEffectChainState = (width, height) => ({
  pool: new CanvasPool(width, height),
  setupCache: /* @__PURE__ */ new WeakMap(),
  cleanupRegistry: [],
  currentRunId: 0
});
var cleanupEffectChainState = (state) => {
  state.currentRunId++;
  for (const entry of state.cleanupRegistry) {
    entry.definition.cleanup(entry.state);
  }
};
var ensureSetup = (state, def, target) => {
  const widened = def;
  if (state.setupCache.has(widened)) {
    return state.setupCache.get(widened);
  }
  const setupState = def.setup(target);
  state.setupCache.set(widened, setupState);
  state.cleanupRegistry.push({ definition: widened, state: setupState });
  return setupState;
};
var runEffectChain = async ({
  state,
  source,
  effects,
  output,
  width,
  height
}) => {
  const runId = ++state.currentRunId;
  const isCancelled = () => state.currentRunId !== runId;
  const enabledEffects = effects.filter((e) => !e.params.disabled);
  const runs = groupByBackend(enabledEffects);
  let currentImage = source;
  let lastTarget = null;
  if (runs.length === 0) {
    if (source === output) {
      return true;
    }
    const ctx = output.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to acquire 2D context for output canvas");
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(currentImage, 0, 0, width, height);
    return true;
  }
  let needsGpuDevice = false;
  for (const run of runs) {
    if (run.backend === "webgpu") {
      needsGpuDevice = true;
      break;
    }
  }
  const gpuDevice = needsGpuDevice ? await getGpuDevice() : null;
  if (isCancelled()) {
    return false;
  }
  let flipWebGLSourceY = true;
  for (let runIndex = 0; runIndex < runs.length; runIndex++) {
    const run = runs[runIndex];
    const [a2, b2] = state.pool.getPair(run.backend);
    let dst = a2;
    for (const eff of run.effects) {
      const def = eff.definition;
      const setupState = ensureSetup(state, def, dst);
      def.apply({
        source: currentImage,
        target: dst,
        state: setupState,
        params: eff.params,
        width,
        height,
        gpuDevice,
        flipSourceY: run.backend === "webgl2" ? flipWebGLSourceY : false
      });
      if (run.backend === "webgl2") {
        flipWebGLSourceY = false;
        state.pool.assertContextNotLost(dst);
      }
      currentImage = dst;
      dst = dst === a2 ? b2 : a2;
    }
    lastTarget = currentImage ?? lastTarget;
    const nextRun = runs[runIndex + 1];
    if (nextRun && nextRun.backend !== run.backend && lastTarget) {
      if (run.backend === "2d" && nextRun.backend === "webgl2") {
        currentImage = lastTarget;
        flipWebGLSourceY = true;
      } else {
        const bitmap = await createImageBitmap(lastTarget);
        if (isCancelled()) {
          bitmap.close();
          return false;
        }
        currentImage = bitmap;
        if (nextRun.backend === "webgl2") {
          flipWebGLSourceY = false;
        }
      }
    }
  }
  if (!lastTarget) {
    return true;
  }
  const outCtx = output.getContext("2d");
  if (!outCtx) {
    throw new Error("Failed to acquire 2D context for output canvas");
  }
  outCtx.clearRect(0, 0, width, height);
  outCtx.drawImage(lastTarget, 0, 0, width, height);
  return true;
};
var useEffectChainState = () => {
  const chainStateRef = (0, import_react34.useRef)(null);
  const sizeRef = (0, import_react34.useRef)(null);
  (0, import_react34.useEffect)(() => {
    return () => {
      if (chainStateRef.current) {
        cleanupEffectChainState(chainStateRef.current);
      }
    };
  }, []);
  return (0, import_react34.useMemo)(() => ({
    get: (width, height) => {
      if (!sizeRef.current || sizeRef.current.width !== width || sizeRef.current.height !== height) {
        if (chainStateRef.current) {
          cleanupEffectChainState(chainStateRef.current);
        }
        chainStateRef.current = createEffectChainState(width, height);
        sizeRef.current = { width, height };
      }
      return chainStateRef.current;
    }
  }), []);
};
var CanvasRefForwardingFunction = ({ width, height, fit, className, style, effects }, ref) => {
  const canvasRef = (0, import_react33.useRef)(null);
  const chainState = useEffectChainState();
  const sourceCanvas = (0, import_react33.useMemo)(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.createElement("canvas");
  }, []);
  const draw = (0, import_react33.useCallback)((imageData) => {
    const canvas = canvasRef.current;
    const canvasWidth = width ?? imageData.displayWidth;
    const canvasHeight = height ?? imageData.displayHeight;
    if (!canvas) {
      throw new Error("Canvas ref is not set");
    }
    if (!sourceCanvas) {
      throw new Error("Source canvas is not available");
    }
    sourceCanvas.width = canvasWidth;
    sourceCanvas.height = canvasHeight;
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx) {
      throw new Error("Could not get 2d context for source canvas");
    }
    sourceCtx.drawImage(imageData, ...calculateImageFit(fit, {
      height: imageData.displayHeight,
      width: imageData.displayWidth
    }, {
      width: canvasWidth,
      height: canvasHeight
    }));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    return runEffectChain({
      state: chainState.get(canvasWidth, canvasHeight),
      source: sourceCanvas,
      effects,
      output: canvas,
      width: canvasWidth,
      height: canvasHeight
    });
  }, [chainState, effects, fit, height, sourceCanvas, width]);
  (0, import_react33.useImperativeHandle)(ref, () => {
    return {
      draw,
      getCanvas: () => {
        if (!canvasRef.current) {
          throw new Error("Canvas ref is not set");
        }
        return canvasRef.current;
      },
      clear: () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get 2d context");
        }
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [draw]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("canvas", {
    ref: canvasRef,
    className,
    style
  });
};
var Canvas = import_react33.default.forwardRef(CanvasRefForwardingFunction);
var CACHE_SIZE = 5;
var getActualTime = ({
  loopBehavior,
  durationFound,
  timeInSec
}) => {
  return loopBehavior === "loop" ? durationFound ? timeInSec % durationFound : timeInSec : Math.min(timeInSec, durationFound || Infinity);
};
var decodeImage = async ({
  resolvedSrc,
  signal,
  currentTime,
  initialLoopBehavior
}) => {
  if (typeof ImageDecoder === "undefined") {
    throw new Error("Your browser does not support the WebCodecs ImageDecoder API.");
  }
  const res = await fetch(resolvedSrc, { signal });
  const { body } = res;
  if (!body) {
    throw new Error("Got no body");
  }
  const decoder = new ImageDecoder({
    data: body,
    type: res.headers.get("Content-Type") || "image/gif"
  });
  await decoder.completed;
  const { selectedTrack } = decoder.tracks;
  if (!selectedTrack) {
    throw new Error("No selected track");
  }
  const cache = [];
  let durationFound = null;
  const getFrameByIndex = async (frameIndex) => {
    const foundInCache = cache.find((c2) => c2.frameIndex === frameIndex);
    if (foundInCache && foundInCache.frame) {
      return foundInCache;
    }
    const frame = await decoder.decode({
      frameIndex,
      completeFramesOnly: true
    });
    if (foundInCache) {
      foundInCache.frame = frame.image;
    } else {
      cache.push({
        frame: frame.image,
        frameIndex,
        timeInSeconds: frame.image.timestamp / 1e6
      });
    }
    return {
      frame: frame.image,
      frameIndex,
      timeInSeconds: frame.image.timestamp / 1e6
    };
  };
  const clearCache = (closeToTimeInSec) => {
    const itemsInCache = cache.filter((c2) => c2.frame);
    const sortByClosestToCurrentTime = itemsInCache.sort((a2, b2) => {
      const aDiff = Math.abs(a2.timeInSeconds - closeToTimeInSec);
      const bDiff = Math.abs(b2.timeInSeconds - closeToTimeInSec);
      return aDiff - bDiff;
    });
    for (let i = 0; i < sortByClosestToCurrentTime.length; i++) {
      if (i < CACHE_SIZE) {
        continue;
      }
      const item = sortByClosestToCurrentTime[i];
      item.frame = null;
    }
  };
  const ensureFrameBeforeAndAfter = async ({
    timeInSec,
    loopBehavior
  }) => {
    const actualTimeInSec = getActualTime({
      durationFound,
      loopBehavior,
      timeInSec
    });
    const framesBefore = cache.filter((c2) => c2.timeInSeconds <= actualTimeInSec);
    const biggestIndex = framesBefore.map((c2) => c2.frameIndex).reduce((a2, b2) => Math.max(a2, b2), 0);
    let i = biggestIndex;
    while (true) {
      const f = await getFrameByIndex(i);
      i++;
      if (!f.frame) {
        throw new Error("No frame found");
      }
      if (!f.frame.duration) {
        break;
      }
      if (i === selectedTrack.frameCount && durationFound === null) {
        const duration = (f.frame.timestamp + f.frame.duration) / 1e6;
        durationFound = duration;
      }
      if (f.timeInSeconds > actualTimeInSec || i === selectedTrack.frameCount) {
        break;
      }
    }
    if (selectedTrack.frameCount - biggestIndex < 3 && loopBehavior === "loop") {
      await getFrameByIndex(0);
    }
    clearCache(actualTimeInSec);
  };
  await ensureFrameBeforeAndAfter({
    timeInSec: currentTime,
    loopBehavior: initialLoopBehavior
  });
  await ensureFrameBeforeAndAfter({
    timeInSec: currentTime,
    loopBehavior: initialLoopBehavior
  });
  const getFrame = async (timeInSec, loopBehavior) => {
    if (durationFound !== null && timeInSec > durationFound && loopBehavior === "clear-after-finish") {
      return null;
    }
    const actualTimeInSec = getActualTime({
      loopBehavior,
      durationFound,
      timeInSec
    });
    await ensureFrameBeforeAndAfter({ timeInSec: actualTimeInSec, loopBehavior });
    const itemsInCache = cache.filter((c2) => c2.frame);
    const closest = itemsInCache.reduce((a2, b2) => {
      const aDiff = Math.abs(a2.timeInSeconds - actualTimeInSec);
      const bDiff = Math.abs(b2.timeInSeconds - actualTimeInSec);
      return aDiff < bDiff ? a2 : b2;
    });
    if (!closest.frame) {
      throw new Error("No frame found");
    }
    return closest;
  };
  return {
    getFrame,
    frameCount: selectedTrack.frameCount
  };
};
var resolveAnimatedImageSource = (src) => {
  if (typeof window === "undefined") {
    return src;
  }
  return new URL(src, window.origin).href;
};
var animatedImageSchema = {
  playbackRate: {
    type: "number",
    min: 0,
    max: 10,
    step: 0.1,
    default: 1,
    description: "Playback Rate"
  },
  ...sequenceVisualStyleSchema,
  hidden: hiddenField
};
var AnimatedImageContent = (0, import_react32.forwardRef)(({
  src,
  width,
  height,
  onError,
  loopBehavior = "loop",
  playbackRate = 1,
  fit = "fill",
  effects,
  controls,
  ...props
}, canvasRef) => {
  const resolvedSrc = resolveAnimatedImageSource(src);
  const [imageDecoder, setImageDecoder] = (0, import_react32.useState)(null);
  const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
  const [decodeHandle] = (0, import_react32.useState)(() => delayRender2(`Rendering <AnimatedImage/> with src="${resolvedSrc}"`));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / playbackRate / fps;
  const currentTimeRef = (0, import_react32.useRef)(currentTime);
  currentTimeRef.current = currentTime;
  const ref = (0, import_react32.useRef)(null);
  const memoizedEffects = useMemoizedEffects({
    effects,
    overrideId: controls?.overrideId ?? null
  });
  (0, import_react32.useImperativeHandle)(canvasRef, () => {
    const c2 = ref.current?.getCanvas();
    if (!c2) {
      throw new Error("Canvas ref is not set");
    }
    return c2;
  }, []);
  const [initialLoopBehavior] = (0, import_react32.useState)(() => loopBehavior);
  (0, import_react32.useEffect)(() => {
    const controller = new AbortController();
    decodeImage({
      resolvedSrc,
      signal: controller.signal,
      currentTime: currentTimeRef.current,
      initialLoopBehavior
    }).then((d) => {
      setImageDecoder(d);
      continueRender2(decodeHandle);
    }).catch((err) => {
      if (err.name === "AbortError") {
        continueRender2(decodeHandle);
        return;
      }
      if (onError) {
        onError?.(err);
        continueRender2(decodeHandle);
      } else {
        cancelRender(err);
      }
    });
    return () => {
      controller.abort();
    };
  }, [
    resolvedSrc,
    decodeHandle,
    onError,
    initialLoopBehavior,
    continueRender2
  ]);
  (0, import_react32.useLayoutEffect)(() => {
    if (!imageDecoder) {
      return;
    }
    const delay = delayRender2(`Rendering frame at ${currentTime} of <AnimatedImage src="${src}"/>`);
    let cancelled = false;
    imageDecoder.getFrame(currentTime, loopBehavior).then(async (videoFrame) => {
      if (cancelled) {
        return;
      }
      if (videoFrame === null) {
        ref.current?.clear();
        continueRender2(delay);
        return;
      }
      const completed = await ref.current?.draw(videoFrame.frame);
      if (completed && !cancelled) {
        continueRender2(delay);
      }
    }).catch((err) => {
      if (cancelled) {
        return;
      }
      if (onError) {
        onError(err);
        continueRender2(delay);
      } else {
        cancelRender(err);
      }
    });
    return () => {
      cancelled = true;
      continueRender2(delay);
    };
  }, [
    currentTime,
    imageDecoder,
    loopBehavior,
    onError,
    src,
    continueRender2,
    delayRender2,
    memoizedEffects,
    fit,
    width,
    height
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Canvas, {
    ref,
    width,
    height,
    fit,
    effects: memoizedEffects,
    ...props
  });
});
AnimatedImageContent.displayName = "AnimatedImageContent";
var AnimatedImageInner = ({
  src,
  width,
  height,
  onError,
  fit,
  playbackRate,
  loopBehavior,
  id,
  className,
  style,
  durationInFrames,
  effects = [],
  _experimentalControls: controls,
  ref,
  ...sequenceProps
}) => {
  const { durationInFrames: videoDuration } = useVideoConfig();
  const resolvedDuration = durationInFrames ?? videoDuration;
  const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
  const animatedImageProps = {
    src,
    width,
    height,
    onError,
    fit,
    playbackRate,
    loopBehavior,
    id,
    className,
    style
  };
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Sequence, {
    layout: "none",
    durationInFrames: resolvedDuration,
    name: "<AnimatedImage>",
    _remotionInternalDocumentationLink: "https://www.remotion.dev/docs/animatedimage",
    _experimentalControls: controls,
    _remotionInternalEffects: memoizedEffectDefinitions,
    ...sequenceProps,
    children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AnimatedImageContent, {
      ...animatedImageProps,
      ref,
      effects,
      controls
    })
  });
};
var AnimatedImage = wrapInSchema(AnimatedImageInner, animatedImageSchema);
AnimatedImage.displayName = "AnimatedImage";
addSequenceStackTraces(AnimatedImage);
var solidSchema = {
  color: {
    type: "color",
    default: "transparent",
    description: "Color"
  },
  width: {
    type: "number",
    min: 1,
    step: 1,
    default: 1920,
    description: "Width"
  },
  height: {
    type: "number",
    min: 1,
    step: 1,
    default: 1080,
    description: "Height"
  },
  ...sequenceVisualStyleSchema
};
var SolidInner = ({
  color,
  width,
  height,
  effects = [],
  className,
  style,
  overrideId,
  ref
}) => {
  const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
  const [outputCanvas, setOutputCanvas] = (0, import_react35.useState)(null);
  const memoizedEffects = useMemoizedEffects({
    effects,
    overrideId: overrideId ?? null
  });
  const sourceCanvas = (0, import_react35.useMemo)(() => {
    if (typeof document === "undefined") {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }, []);
  const chainState = useEffectChainState();
  const canvasRef = (0, import_react35.useCallback)((canvas) => {
    setOutputCanvas(canvas);
    if (typeof ref === "function") {
      ref(canvas);
    } else if (ref) {
      ref.current = canvas;
    }
  }, [ref]);
  (0, import_react35.useEffect)(() => {
    if (!outputCanvas || !sourceCanvas) {
      return;
    }
    const handle = delayRender2("Solid effect chain");
    if (!chainState) {
      continueRender2(handle);
      return () => {
        continueRender2(handle);
      };
    }
    const ctx = sourceCanvas.getContext("2d", { colorSpace: "srgb" });
    if (!ctx) {
      cancelRender2(new Error("Failed to acquire 2D context for <Solid> source"));
      return;
    }
    ctx.clearRect(0, 0, 1, 1);
    if (color !== void 0) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
    }
    runEffectChain({
      state: chainState.get(width, height),
      source: sourceCanvas,
      effects: memoizedEffects,
      output: outputCanvas,
      width,
      height
    }).then((completed) => {
      if (completed) {
        continueRender2(handle);
      }
    }).catch((err) => {
      cancelRender2(err);
    });
    return () => {
      continueRender2(handle);
    };
  }, [
    color,
    outputCanvas,
    sourceCanvas,
    chainState,
    width,
    height,
    delayRender2,
    continueRender2,
    cancelRender2,
    memoizedEffects
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("canvas", {
    ref: canvasRef,
    width,
    height,
    className,
    style
  });
};
var SolidOuter = (0, import_react35.forwardRef)(({
  effects = [],
  _experimentalControls: controls,
  color,
  height,
  width,
  className,
  durationInFrames,
  style,
  name,
  from,
  hidden,
  showInTimeline,
  ...props
}, ref) => {
  const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Sequence, {
    layout: "none",
    from,
    hidden,
    showInTimeline,
    _experimentalControls: controls,
    _remotionInternalEffects: memoizedEffectDefinitions,
    durationInFrames,
    name: name ?? "<Solid>",
    _remotionInternalDocumentationLink: name === void 0 ? "https://www.remotion.dev/docs/solid" : void 0,
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SolidInner, {
      ref,
      overrideId: controls?.overrideId ?? null,
      color,
      height,
      width,
      className,
      style,
      effects
    })
  });
});
var Solid = wrapInSchema(SolidOuter, solidSchema);
Solid.displayName = "Solid";
addSequenceStackTraces(Solid);
var cachedSupport = null;
var isHtmlInCanvasSupported = () => {
  if (cachedSupport !== null) {
    return cachedSupport;
  }
  if (typeof document === "undefined") {
    return false;
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  cachedSupport = typeof ctx?.drawElementImage === "function" && typeof canvas.requestPaint === "function" && typeof canvas.captureElementImage === "function" && "transferControlToOffscreen" in HTMLCanvasElement.prototype;
  return cachedSupport;
};
var HTML_IN_CANVAS_UNSUPPORTED_MESSAGE = "HTML in Canvas is not supported. Two common causes: Chrome is older than version 148 (update Chrome), or the HTML-in-Canvas flag is disabled at chrome://flags/#canvas-draw-element (enable it and restart Chrome).";
function assertHtmlInCanvasDimensions(width, height) {
  if (typeof width !== "number" || typeof height !== "number") {
    throw new Error(`HtmlInCanvas: \`width\` and \`height\` must be numbers. Received width=${String(width)}, height=${String(height)}.`);
  }
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`HtmlInCanvas: \`width\` must be a positive integer. Received: ${String(width)}.`);
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`HtmlInCanvas: \`height\` must be a positive integer. Received: ${String(height)}.`);
  }
}
var defaultOnPaint = ({
  canvas,
  element,
  elementImage
}) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to acquire 2D context for <HtmlInCanvas> canvas");
  }
  ctx.reset();
  const transform = ctx.drawElementImage(elementImage, 0, 0);
  element.style.transform = transform.toString();
};
var HtmlInCanvasAncestorContext = (0, import_react36.createContext)(false);
var HtmlInCanvasContent = (0, import_react36.forwardRef)(({ width, height, effects, children, onPaint, onInit, controls, style }, ref) => {
  const isInsideAncestorHtmlInCanvas = (0, import_react36.useContext)(HtmlInCanvasAncestorContext);
  assertHtmlInCanvasDimensions(width, height);
  const { continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
  if (!isHtmlInCanvasSupported()) {
    cancelRender2(new Error(HTML_IN_CANVAS_UNSUPPORTED_MESSAGE));
  }
  const canvas2dRef = (0, import_react36.useRef)(null);
  const offscreenRef = (0, import_react36.useRef)(null);
  const divRef = (0, import_react36.useRef)(null);
  const canvasSizeKey = `${width}x${height}`;
  const setLayoutCanvasRef = (0, import_react36.useCallback)((node) => {
    canvas2dRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);
  const chainState = useEffectChainState();
  const memoizedEffects = useMemoizedEffects({
    effects,
    overrideId: controls?.overrideId ?? null
  });
  const effectsRef = (0, import_react36.useRef)(memoizedEffects);
  effectsRef.current = memoizedEffects;
  const onPaintRef = (0, import_react36.useRef)(onPaint);
  onPaintRef.current = onPaint;
  const onInitRef = (0, import_react36.useRef)(onInit);
  onInitRef.current = onInit;
  const initializedRef = (0, import_react36.useRef)(false);
  const onInitCleanupRef = (0, import_react36.useRef)(null);
  const unmountedRef = (0, import_react36.useRef)(false);
  const onPaintCb = (0, import_react36.useCallback)(async () => {
    const element = divRef.current;
    if (!element) {
      throw new Error("Canvas or scene element not found");
    }
    const offscreen = offscreenRef.current;
    if (!offscreen) {
      throw new Error("HtmlInCanvas: offscreen canvas not ready (transferControlToOffscreen failed or canvas is remounting)");
    }
    offscreen.width = width;
    offscreen.height = height;
    try {
      const placeholderCanvas = canvas2dRef.current;
      if (!placeholderCanvas) {
        throw new Error("Canvas not found");
      }
      const offscreen2d = offscreen.getContext("2d");
      if (!offscreen2d) {
        throw new Error("Failed to acquire 2D context for <HtmlInCanvas> offscreen canvas");
      }
      const handle = delayRender("onPaint");
      if (!initializedRef.current) {
        initializedRef.current = true;
        const initImage = placeholderCanvas.captureElementImage(element);
        const currentOnInit = onInitRef.current;
        if (currentOnInit) {
          const cleanup = await currentOnInit({
            canvas: offscreen,
            element,
            elementImage: initImage
          });
          if (typeof cleanup !== "function") {
            throw new Error("HtmlInCanvas: when `onInit` is provided, it must return a cleanup function, or a Promise that resolves to one.");
          }
          if (unmountedRef.current) {
            cleanup();
          } else {
            onInitCleanupRef.current = cleanup;
          }
        }
      }
      const handler = onPaintRef.current ?? defaultOnPaint;
      const elImage = placeholderCanvas.captureElementImage(element);
      await handler({
        canvas: offscreen,
        element,
        elementImage: elImage
      });
      await runEffectChain({
        state: chainState.get(width, height),
        source: offscreen,
        effects: effectsRef.current,
        output: offscreen,
        width,
        height
      });
      continueRender2(handle);
    } catch (error2) {
      cancelRender2(error2);
    }
  }, [chainState, continueRender2, cancelRender2, width, height]);
  (0, import_react36.useLayoutEffect)(() => {
    const placeholder = canvas2dRef.current;
    if (!placeholder) {
      throw new Error("Canvas not found");
    }
    placeholder.layoutSubtree = true;
    const offscreen = placeholder.transferControlToOffscreen();
    offscreenRef.current = offscreen;
    offscreen.width = width;
    offscreen.height = height;
    initializedRef.current = false;
    unmountedRef.current = false;
    placeholder.addEventListener("paint", onPaintCb);
    return () => {
      placeholder.removeEventListener("paint", onPaintCb);
      offscreenRef.current = null;
      initializedRef.current = false;
      unmountedRef.current = true;
      onInitCleanupRef.current?.();
      onInitCleanupRef.current = null;
    };
  }, [onPaintCb, cancelRender2, width, height]);
  const onPaintChangedRef = (0, import_react36.useRef)(false);
  (0, import_react36.useLayoutEffect)(() => {
    if (!onPaintChangedRef.current) {
      onPaintChangedRef.current = true;
      return;
    }
    const canvas = canvas2dRef.current;
    if (!canvas) {
      return;
    }
    canvas.requestPaint?.();
  }, [onPaint, memoizedEffects]);
  (0, import_react36.useLayoutEffect)(() => {
    const canvas = canvas2dRef.current;
    if (!canvas) {
      return;
    }
    const handle = delayRender("waiting for first paint after canvas resize");
    canvas.addEventListener("paint", () => {
      continueRender2(handle);
    }, { once: true });
    return () => {
      continueRender2(handle);
    };
  }, [width, height, continueRender2, canvasSizeKey]);
  const innerStyle = (0, import_react36.useMemo)(() => {
    return {
      width,
      height
    };
  }, [width, height]);
  if (isInsideAncestorHtmlInCanvas) {
    throw new Error("<HtmlInCanvas> effects cannot be nested together. Chrome will only display the outer effect. Consider merging the effects into one if you can.");
  }
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(HtmlInCanvasAncestorContext.Provider, {
    value: true,
    children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("canvas", {
      ref: setLayoutCanvasRef,
      width,
      height,
      style,
      children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", {
        ref: divRef,
        style: innerStyle,
        children
      })
    }, canvasSizeKey)
  });
});
HtmlInCanvasContent.displayName = "HtmlInCanvasContent";
var HtmlInCanvasInner = (0, import_react36.forwardRef)(({
  width,
  height,
  effects = [],
  children,
  onPaint,
  onInit,
  _experimentalControls: controls,
  style,
  durationInFrames,
  name,
  ...sequenceProps
}, ref) => {
  const { durationInFrames: videoDuration } = useVideoConfig();
  const resolvedDuration = durationInFrames ?? videoDuration;
  const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Sequence, {
    durationInFrames: resolvedDuration,
    name: name ?? "<HtmlInCanvas>",
    _remotionInternalDocumentationLink: name === void 0 ? "https://www.remotion.dev/docs/remotion/html-in-canvas" : void 0,
    _experimentalControls: controls,
    _remotionInternalEffects: memoizedEffectDefinitions,
    layout: "none",
    ...sequenceProps,
    children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(HtmlInCanvasContent, {
      ref,
      width,
      height,
      effects,
      onPaint,
      onInit,
      controls,
      style,
      children
    })
  });
});
HtmlInCanvasInner.displayName = "HtmlInCanvas";
var htmlInCanvasSchema = {
  ...sequenceVisualStyleSchema,
  hidden: hiddenField
};
var HtmlInCanvasWrapped = wrapInSchema(HtmlInCanvasInner, htmlInCanvasSchema);
var HtmlInCanvas = Object.assign(HtmlInCanvasWrapped, {
  isSupported: isHtmlInCanvasSupported
});
HtmlInCanvas.displayName = "HtmlInCanvas";
addSequenceStackTraces(HtmlInCanvas);
var RenderAssetManager = (0, import_react38.createContext)({
  registerRenderAsset: () => {
    return;
  },
  unregisterRenderAsset: () => {
    return;
  },
  renderAssets: []
});
var ArtifactThumbnail = /* @__PURE__ */ Symbol("Thumbnail");
var Artifact = ({ filename, content, downloadBehavior }) => {
  const { registerRenderAsset, unregisterRenderAsset } = (0, import_react37.useContext)(RenderAssetManager);
  const env = useRemotionEnvironment();
  const frame = useCurrentFrame();
  const [id] = (0, import_react37.useState)(() => {
    return String(Math.random());
  });
  (0, import_react37.useLayoutEffect)(() => {
    if (!env.isRendering) {
      return;
    }
    if (content instanceof Uint8Array) {
      registerRenderAsset({
        type: "artifact",
        id,
        content: btoa(new TextDecoder("utf8").decode(content)),
        filename,
        frame,
        contentType: "binary",
        downloadBehavior: downloadBehavior ?? null
      });
    } else if (content === ArtifactThumbnail) {
      registerRenderAsset({
        type: "artifact",
        id,
        filename,
        frame,
        contentType: "thumbnail",
        downloadBehavior: downloadBehavior ?? null
      });
    } else {
      registerRenderAsset({
        type: "artifact",
        id,
        content,
        filename,
        frame,
        contentType: "text",
        downloadBehavior: downloadBehavior ?? null
      });
    }
    return () => {
      return unregisterRenderAsset(id);
    };
  }, [
    content,
    env.isRendering,
    filename,
    frame,
    id,
    registerRenderAsset,
    unregisterRenderAsset,
    downloadBehavior
  ]);
  return null;
};
Artifact.Thumbnail = ArtifactThumbnail;
var getAbsoluteSrc = (relativeSrc) => {
  if (typeof window === "undefined") {
    return relativeSrc;
  }
  if (relativeSrc.startsWith("http://") || relativeSrc.startsWith("https://") || relativeSrc.startsWith("file://") || relativeSrc.startsWith("blob:") || relativeSrc.startsWith("data:")) {
    return relativeSrc;
  }
  return new URL(relativeSrc, window.origin).href;
};
var calculateMediaDuration = ({
  trimAfter,
  mediaDurationInFrames,
  playbackRate,
  trimBefore
}) => {
  let duration = mediaDurationInFrames;
  if (typeof trimAfter !== "undefined") {
    duration = trimAfter;
  }
  if (typeof trimBefore !== "undefined") {
    duration -= trimBefore;
  }
  const actualDuration = duration / playbackRate;
  return Math.floor(actualDuration);
};
var LoopContext = (0, import_react40.createContext)(null);
var useLoop = () => {
  return import_react40.default.useContext(LoopContext);
};
var Loop = ({
  durationInFrames,
  times = Infinity,
  children,
  name,
  showInTimeline,
  ...props
}) => {
  const currentFrame = useCurrentFrame();
  const { durationInFrames: compDuration } = useVideoConfig();
  validateDurationInFrames(durationInFrames, {
    component: "of the <Loop /> component",
    allowFloats: true
  });
  if (typeof times !== "number") {
    throw new TypeError(`You passed to "times" an argument of type ${typeof times}, but it must be a number.`);
  }
  if (times !== Infinity && times % 1 !== 0) {
    throw new TypeError(`The "times" prop of a loop must be an integer, but got ${times}.`);
  }
  if (times < 0) {
    throw new TypeError(`The "times" prop of a loop must be at least 0, but got ${times}`);
  }
  const maxTimes = Math.ceil(compDuration / durationInFrames);
  const actualTimes = Math.min(maxTimes, times);
  const style = props.layout === "none" ? void 0 : props.style;
  const maxFrame = durationInFrames * (actualTimes - 1);
  const iteration = Math.floor(currentFrame / durationInFrames);
  const start = iteration * durationInFrames;
  const from = Math.min(start, maxFrame);
  const loopDisplay = (0, import_react40.useMemo)(() => {
    return {
      numberOfTimes: Math.min(compDuration / durationInFrames, times),
      startOffset: -from,
      durationInFrames
    };
  }, [compDuration, durationInFrames, from, times]);
  const loopContext = (0, import_react40.useMemo)(() => {
    return {
      iteration: Math.floor(currentFrame / durationInFrames),
      durationInFrames
    };
  }, [currentFrame, durationInFrames]);
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(LoopContext.Provider, {
    value: loopContext,
    children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Sequence, {
      durationInFrames,
      from,
      name: name ?? "<Loop>",
      _remotionInternalDocumentationLink: name === void 0 ? "https://www.remotion.dev/docs/loop" : void 0,
      _remotionInternalLoopDisplay: loopDisplay,
      layout: props.layout,
      style,
      showInTimeline,
      children
    })
  });
};
Loop.useLoop = useLoop;
var playbackLogging = ({
  logLevel,
  tag,
  message,
  mountTime
}) => {
  const tags = [mountTime ? Date.now() - mountTime + "ms " : null, tag].filter(Boolean).join(" ");
  Log.trace({ logLevel, tag: null }, `[${tags}]`, message);
};
var PreloadContext = (0, import_react42.createContext)({});
var removeAndGetHashFragment = (src) => {
  const hashIndex = src.indexOf("#");
  if (hashIndex === -1) {
    return null;
  }
  return hashIndex;
};
var getSrcWithoutHash = (src) => {
  const hashIndex = removeAndGetHashFragment(src);
  if (hashIndex === null) {
    return src;
  }
  return src.slice(0, hashIndex);
};
var usePreload = (src) => {
  const preloads2 = (0, import_react41.useContext)(PreloadContext);
  const hashFragmentIndex = removeAndGetHashFragment(src);
  const withoutHashFragment = getSrcWithoutHash(src);
  if (!preloads2[withoutHashFragment]) {
    return src;
  }
  if (hashFragmentIndex !== null) {
    return preloads2[withoutHashFragment] + src.slice(hashFragmentIndex);
  }
  return preloads2[withoutHashFragment];
};
var validateMediaProps = (props, component) => {
  if (typeof props.volume !== "number" && typeof props.volume !== "function" && typeof props.volume !== "undefined") {
    throw new TypeError(`You have passed a volume of type ${typeof props.volume} to your <${component} /> component. Volume must be a number or a function with the signature '(frame: number) => number' undefined.`);
  }
  if (typeof props.volume === "number" && props.volume < 0) {
    throw new TypeError(`You have passed a volume below 0 to your <${component} /> component. Volume must be between 0 and 1`);
  }
  if (typeof props.playbackRate !== "number" && typeof props.playbackRate !== "undefined") {
    throw new TypeError(`You have passed a playbackRate of type ${typeof props.playbackRate} to your <${component} /> component. Playback rate must a real number or undefined.`);
  }
  if (typeof props.playbackRate === "number" && (isNaN(props.playbackRate) || !Number.isFinite(props.playbackRate) || props.playbackRate <= 0)) {
    throw new TypeError(`You have passed a playbackRate of ${props.playbackRate} to your <${component} /> component. Playback rate must be a real number above 0.`);
  }
  if (typeof props.preservePitch !== "boolean" && typeof props.preservePitch !== "undefined") {
    throw new TypeError(`'preservePitch' must be a boolean or undefined but got '${typeof props.preservePitch}' instead`);
  }
};
var validateStartFromProps = (startFrom, endAt) => {
  if (typeof startFrom !== "undefined") {
    if (typeof startFrom !== "number") {
      throw new TypeError(`type of startFrom prop must be a number, instead got type ${typeof startFrom}.`);
    }
    if (isNaN(startFrom) || startFrom === Infinity) {
      throw new TypeError("startFrom prop can not be NaN or Infinity.");
    }
    if (startFrom < 0) {
      throw new TypeError(`startFrom must be greater than equal to 0 instead got ${startFrom}.`);
    }
  }
  if (typeof endAt !== "undefined") {
    if (typeof endAt !== "number") {
      throw new TypeError(`type of endAt prop must be a number, instead got type ${typeof endAt}.`);
    }
    if (isNaN(endAt)) {
      throw new TypeError("endAt prop can not be NaN.");
    }
    if (endAt <= 0) {
      throw new TypeError(`endAt must be a positive number, instead got ${endAt}.`);
    }
  }
  if (endAt < startFrom) {
    throw new TypeError("endAt prop must be greater than startFrom prop.");
  }
};
var validateTrimProps = (trimBefore, trimAfter) => {
  if (typeof trimBefore !== "undefined") {
    if (typeof trimBefore !== "number") {
      throw new TypeError(`type of trimBefore prop must be a number, instead got type ${typeof trimBefore}.`);
    }
    if (isNaN(trimBefore) || trimBefore === Infinity) {
      throw new TypeError("trimBefore prop can not be NaN or Infinity.");
    }
    if (trimBefore < 0) {
      throw new TypeError(`trimBefore must be greater than equal to 0 instead got ${trimBefore}.`);
    }
  }
  if (typeof trimAfter !== "undefined") {
    if (typeof trimAfter !== "number") {
      throw new TypeError(`type of trimAfter prop must be a number, instead got type ${typeof trimAfter}.`);
    }
    if (isNaN(trimAfter)) {
      throw new TypeError("trimAfter prop can not be NaN.");
    }
    if (trimAfter <= 0) {
      throw new TypeError(`trimAfter must be a positive number, instead got ${trimAfter}.`);
    }
  }
  if (trimAfter <= trimBefore) {
    throw new TypeError("trimAfter prop must be greater than trimBefore prop.");
  }
};
var validateMediaTrimProps = ({
  startFrom,
  endAt,
  trimBefore,
  trimAfter
}) => {
  if (typeof startFrom !== "undefined" && typeof trimBefore !== "undefined") {
    throw new TypeError("Cannot use both startFrom and trimBefore props. Use trimBefore instead as startFrom is deprecated.");
  }
  if (typeof endAt !== "undefined" && typeof trimAfter !== "undefined") {
    throw new TypeError("Cannot use both endAt and trimAfter props. Use trimAfter instead as endAt is deprecated.");
  }
  const hasNewProps = typeof trimBefore !== "undefined" || typeof trimAfter !== "undefined";
  const hasOldProps = typeof startFrom !== "undefined" || typeof endAt !== "undefined";
  if (hasNewProps) {
    validateTrimProps(trimBefore, trimAfter);
  } else if (hasOldProps) {
    validateStartFromProps(startFrom, endAt);
  }
};
var resolveTrimProps = ({
  startFrom,
  endAt,
  trimBefore,
  trimAfter
}) => {
  const trimBeforeValue = trimBefore ?? startFrom ?? void 0;
  const trimAfterValue = trimAfter ?? endAt ?? void 0;
  return { trimBeforeValue, trimAfterValue };
};
var DurationsContext = (0, import_react43.createContext)({
  durations: {},
  setDurations: () => {
    throw new Error("context missing");
  }
});
var getCrossOriginValue = ({
  crossOrigin,
  requestsVideoFrame,
  isClientSideRendering
}) => {
  if (crossOrigin !== void 0 && crossOrigin !== null) {
    return crossOrigin;
  }
  if (isClientSideRendering) {
    return "anonymous";
  }
  if (requestsVideoFrame) {
    return "anonymous";
  }
  return;
};
var playAndHandleNotAllowedError = ({
  mediaRef,
  mediaType,
  onAutoPlayError,
  logLevel,
  mountTime,
  reason,
  isPlayer
}) => {
  const { current } = mediaRef;
  if (!current) {
    return;
  }
  playbackLogging({
    logLevel,
    tag: "play",
    message: `Attempting to play ${current.src}. Reason: ${reason}`,
    mountTime
  });
  const prom = current.play();
  if (!prom.catch) {
    return;
  }
  prom.catch((err) => {
    if (!current) {
      return;
    }
    if (err.message.includes("request was interrupted by a call to pause")) {
      return;
    }
    if (err.message.includes("The operation was aborted.")) {
      return;
    }
    if (err.message.includes("The fetching process for the media resource was aborted by the user agent")) {
      return;
    }
    if (err.message.includes("request was interrupted by a new load request")) {
      return;
    }
    if (err.message.includes("because the media was removed from the document")) {
      return;
    }
    if (err.message.includes("user didn't interact with the document") && current.muted) {
      return;
    }
    console.log(`Could not play ${mediaType} due to following error: `, err);
    if (!current.muted) {
      if (onAutoPlayError) {
        onAutoPlayError();
        return;
      }
      if (mediaType === "video" && isPlayer) {
        Log.info({ logLevel, tag: "<" + mediaType + ">" }, `The video will be muted and we'll retry playing it.`);
        Log.info({ logLevel, tag: "<" + mediaType + ">" }, "Use onAutoPlayError() to handle this error yourself.");
        current.muted = true;
        current.play();
      }
    }
  });
};
var makeSharedElementSourceNode = ({
  audioContext,
  ref
}) => {
  let connected = null;
  let disposed = false;
  return {
    attemptToConnect: () => {
      if (disposed) {
        throw new Error("SharedElementSourceNode has been disposed");
      }
      if (!connected && ref.current) {
        const mediaElementSourceNode = audioContext.createMediaElementSource(ref.current);
        connected = mediaElementSourceNode;
      }
    },
    get: () => {
      if (!connected) {
        throw new Error("Audio element not connected");
      }
      return connected;
    },
    cleanup: () => {
      if (connected) {
        connected.disconnect();
        connected = null;
      }
      disposed = true;
    }
  };
};
var SharedAudioContext = (0, import_react47.createContext)(null);
var SharedAudioTagsContext = (0, import_react47.createContext)(null);
var useSharedAudio = ({
  aud,
  audioId,
  premounting,
  postmounting
}) => {
  const audioCtx = (0, import_react47.useContext)(SharedAudioContext);
  const tagsCtx = (0, import_react47.useContext)(SharedAudioTagsContext);
  const [elem] = (0, import_react47.useState)(() => {
    if (tagsCtx && tagsCtx.numberOfAudioTags > 0) {
      return tagsCtx.registerAudio({ aud, audioId, premounting, postmounting });
    }
    const el = import_react47.default.createRef();
    const mediaElementSourceNode = audioCtx?.audioContext ? makeSharedElementSourceNode({
      audioContext: audioCtx.audioContext,
      ref: el
    }) : null;
    return {
      el,
      id: Math.random(),
      props: aud,
      audioId,
      mediaElementSourceNode,
      premounting,
      audioMounted: Boolean(el.current),
      postmounting,
      cleanupOnMediaTagUnmount: () => {
        mediaElementSourceNode?.cleanup();
      }
    };
  });
  const effectToUse = import_react47.default.useInsertionEffect ?? import_react47.default.useLayoutEffect;
  if (typeof document !== "undefined") {
    effectToUse(() => {
      if (tagsCtx && tagsCtx.numberOfAudioTags > 0) {
        tagsCtx.updateAudio({
          id: elem.id,
          aud,
          audioId,
          premounting,
          postmounting
        });
      }
    }, [aud, tagsCtx, elem.id, audioId, premounting, postmounting]);
    effectToUse(() => {
      return () => {
        if (tagsCtx && tagsCtx.numberOfAudioTags > 0) {
          tagsCtx.unregisterAudio(elem.id);
        }
      };
    }, [tagsCtx, elem.id]);
  }
  return elem;
};
var FLOATING_POINT_ERROR_THRESHOLD = 1e-5;
var isApproximatelyTheSame = (num1, num2) => {
  return Math.abs(num1 - num2) < FLOATING_POINT_ERROR_THRESHOLD;
};
var toSeconds = (time, fps) => {
  return Math.round(time / fps * 100) / 100;
};
var isSafari = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isAppleWebKit = /AppleWebKit/.test(window.navigator.userAgent);
  if (!isAppleWebKit) {
    return false;
  }
  const isNotChrome = !window.navigator.userAgent.includes("Chrome/");
  return isNotChrome;
};
var isIosSafari = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isIpadIPodIPhone = /iP(ad|od|hone)/i.test(window.navigator.userAgent);
  return isIpadIPodIPhone && isSafari();
};
var isIOSSafariAndBlob = (actualSrc) => {
  return isIosSafari() && actualSrc.startsWith("blob:");
};
var getVideoFragmentStart = ({
  actualFrom,
  fps
}) => {
  return toSeconds(Math.max(0, -actualFrom), fps);
};
var getVideoFragmentEnd = ({
  duration,
  fps
}) => {
  return toSeconds(duration, fps);
};
var appendVideoFragment = ({
  actualSrc,
  actualFrom,
  duration,
  fps
}) => {
  if (isIOSSafariAndBlob(actualSrc)) {
    return actualSrc;
  }
  if (actualSrc.startsWith("data:")) {
    return actualSrc;
  }
  const existingHash = Boolean(new URL(actualSrc, (typeof window === "undefined" ? null : window.location.href) ?? "http://localhost:3000").hash);
  if (existingHash) {
    return actualSrc;
  }
  if (!Number.isFinite(actualFrom)) {
    return actualSrc;
  }
  const withStartHash = `${actualSrc}#t=${getVideoFragmentStart({ actualFrom, fps })}`;
  if (!Number.isFinite(duration)) {
    return withStartHash;
  }
  return `${withStartHash},${getVideoFragmentEnd({ duration, fps })}`;
};
var isSubsetOfDuration = ({
  prevStartFrom,
  newStartFrom,
  prevDuration,
  newDuration,
  fps
}) => {
  const previousFrom = getVideoFragmentStart({ actualFrom: prevStartFrom, fps });
  const newFrom = getVideoFragmentStart({ actualFrom: newStartFrom, fps });
  const previousEnd = getVideoFragmentEnd({ duration: prevDuration, fps });
  const newEnd = getVideoFragmentEnd({ duration: newDuration, fps });
  if (newFrom < previousFrom) {
    return false;
  }
  if (newEnd > previousEnd) {
    return false;
  }
  return true;
};
var useAppendVideoFragment = ({
  actualSrc: initialActualSrc,
  actualFrom: initialActualFrom,
  duration: initialDuration,
  fps
}) => {
  const actualFromRef = (0, import_react49.useRef)(initialActualFrom);
  const actualDuration = (0, import_react49.useRef)(initialDuration);
  const actualSrc = (0, import_react49.useRef)(initialActualSrc);
  if (!isSubsetOfDuration({
    prevStartFrom: actualFromRef.current,
    newStartFrom: initialActualFrom,
    prevDuration: actualDuration.current,
    newDuration: initialDuration,
    fps
  }) || initialActualSrc !== actualSrc.current) {
    actualFromRef.current = initialActualFrom;
    actualDuration.current = initialDuration;
    actualSrc.current = initialActualSrc;
  }
  const appended = appendVideoFragment({
    actualSrc: actualSrc.current,
    actualFrom: actualFromRef.current,
    duration: actualDuration.current,
    fps
  });
  return appended;
};
var warned2 = false;
var warnSafariOnce = (logLevel) => {
  if (warned2) {
    return;
  }
  warned2 = true;
  Log.warn({ logLevel, tag: null }, "In Safari, setting a volume and a playback rate at the same time is buggy.");
  Log.warn({ logLevel, tag: null }, "In Desktop Safari, only volumes <= 1 will be applied.");
  Log.warn({ logLevel, tag: null }, logLevel, "In Mobile Safari, the volume will be ignored and set to 1 if a playbackRate is set.");
};
var useVolume = ({
  mediaRef,
  volume,
  logLevel,
  source,
  shouldUseWebAudioApi
}) => {
  const audioStuffRef = (0, import_react46.useRef)(null);
  const currentVolumeRef = (0, import_react46.useRef)(volume);
  currentVolumeRef.current = volume;
  const sharedAudioContext = (0, import_react46.useContext)(SharedAudioContext);
  if (!sharedAudioContext) {
    throw new Error("useAmplification must be used within a SharedAudioContext");
  }
  const { audioContext, gainNode: masterGainNode } = sharedAudioContext;
  if (typeof window !== "undefined") {
    (0, import_react46.useLayoutEffect)(() => {
      if (!audioContext) {
        return;
      }
      if (!mediaRef.current) {
        return;
      }
      if (!shouldUseWebAudioApi) {
        return;
      }
      if (mediaRef.current.playbackRate !== 1 && isSafari()) {
        warnSafariOnce(logLevel);
        return;
      }
      if (!source) {
        return;
      }
      if (!masterGainNode) {
        return;
      }
      const gainNode = new GainNode(audioContext, {
        gain: currentVolumeRef.current
      });
      source.attemptToConnect();
      source.get().connect(gainNode);
      gainNode.connect(masterGainNode);
      audioStuffRef.current = {
        gainNode
      };
      Log.trace({ logLevel, tag: null }, `Starting to amplify ${mediaRef.current?.src}. Gain = ${currentVolumeRef.current}, playbackRate = ${mediaRef.current?.playbackRate}`);
      return () => {
        audioStuffRef.current = null;
        gainNode.disconnect();
        source.get().disconnect();
      };
    }, [
      logLevel,
      mediaRef,
      audioContext,
      source,
      shouldUseWebAudioApi,
      masterGainNode
    ]);
  }
  if (audioStuffRef.current) {
    const valueToSet = volume;
    if (!isApproximatelyTheSame(audioStuffRef.current.gainNode.gain.value, valueToSet)) {
      audioStuffRef.current.gainNode.gain.value = valueToSet;
      Log.trace({ logLevel, tag: null }, `Setting gain to ${valueToSet} for ${mediaRef.current?.src}`);
    }
  }
  const safariCase = isSafari() && mediaRef.current && mediaRef.current?.playbackRate !== 1;
  const shouldUseTraditionalVolume = safariCase || !shouldUseWebAudioApi;
  if (shouldUseTraditionalVolume && mediaRef.current && !isApproximatelyTheSame(volume, mediaRef.current?.volume)) {
    mediaRef.current.volume = Math.min(volume, 1);
  }
  return audioStuffRef;
};
var useMediaStartsAt = () => {
  const parentSequence = (0, import_react51.useContext)(SequenceContext);
  return parentSequence?.cumulatedNegativeFrom ?? 0;
};
var useFrameForVolumeProp = (behavior) => {
  const loop = Loop.useLoop();
  const frame = useCurrentFrame();
  const startsAt = useMediaStartsAt();
  if (behavior === "repeat" || loop === null) {
    return frame + startsAt;
  }
  return frame + startsAt + loop.durationInFrames * loop.iteration;
};
var getAssetDisplayName = (filename) => {
  if (/data:|blob:/.test(filename.substring(0, 5))) {
    return "Data URL";
  }
  const splitted = filename.split("/").map((s) => s.split("\\")).flat(1);
  return splitted[splitted.length - 1];
};
var getTimelineDuration = ({
  compositionDurationInFrames,
  playbackRate,
  trimBefore,
  trimAfter,
  parentSequenceDurationInFrames,
  loop
}) => {
  if (loop) {
    return compositionDurationInFrames;
  }
  const mediaDuration = calculateMediaDuration({
    mediaDurationInFrames: compositionDurationInFrames * playbackRate + (trimBefore ?? 0),
    playbackRate,
    trimBefore,
    trimAfter
  });
  if (parentSequenceDurationInFrames !== null) {
    const cappedDuration = Math.min(parentSequenceDurationInFrames * playbackRate, mediaDuration);
    return Number(cappedDuration.toFixed(10));
  }
  return mediaDuration;
};
var evaluateVolume = ({
  frame,
  volume,
  mediaVolume = 1
}) => {
  if (typeof volume === "number") {
    return volume * mediaVolume;
  }
  if (typeof volume === "undefined") {
    return Number(mediaVolume);
  }
  const evaluated = volume(frame) * mediaVolume;
  if (typeof evaluated !== "number") {
    throw new TypeError(`You passed in a a function to the volume prop but it did not return a number but a value of type ${typeof evaluated} for frame ${frame}`);
  }
  if (Number.isNaN(evaluated)) {
    throw new TypeError(`You passed in a function to the volume prop but it returned NaN for frame ${frame}.`);
  }
  if (!Number.isFinite(evaluated)) {
    throw new TypeError(`You passed in a function to the volume prop but it returned a non-finite number for frame ${frame}.`);
  }
  return Math.max(0, evaluated);
};
var didWarn = {};
var warnOnce2 = (message) => {
  if (didWarn[message]) {
    return;
  }
  console.warn(message);
  didWarn[message] = true;
};
var useBasicMediaInTimeline = ({
  volume,
  mediaVolume,
  mediaType,
  src,
  displayName,
  trimBefore,
  trimAfter,
  playbackRate,
  sequenceDurationInFrames,
  mediaStartsAt,
  loop
}) => {
  if (!src) {
    throw new Error("No src passed");
  }
  const parentSequence = (0, import_react50.useContext)(SequenceContext);
  const [initialVolume] = (0, import_react50.useState)(() => volume);
  const duration = getTimelineDuration({
    compositionDurationInFrames: sequenceDurationInFrames,
    playbackRate,
    trimBefore,
    trimAfter,
    parentSequenceDurationInFrames: parentSequence?.durationInFrames ?? null,
    loop
  });
  const volumes = (0, import_react50.useMemo)(() => {
    if (typeof volume === "number") {
      return volume;
    }
    return new Array(Math.floor(Math.max(0, duration + mediaStartsAt))).fill(true).map((_, i) => {
      return evaluateVolume({
        frame: i + mediaStartsAt,
        volume,
        mediaVolume
      });
    }).join(",");
  }, [duration, mediaStartsAt, volume, mediaVolume]);
  (0, import_react50.useEffect)(() => {
    if (typeof volume === "number" && volume !== initialVolume) {
      warnOnce2(`Remotion: The ${mediaType} with src ${src} has changed it's volume. Prefer the callback syntax for setting volume to get better timeline display: https://www.remotion.dev/docs/audio/volume`);
    }
  }, [initialVolume, mediaType, src, volume]);
  const doesVolumeChange = typeof volume === "function";
  const nonce = useNonce();
  const { rootId } = useTimelineContext();
  const startMediaFrom = 0 - mediaStartsAt + (trimBefore ?? 0);
  const memoizedResult = (0, import_react50.useMemo)(() => {
    return {
      volumes,
      duration,
      doesVolumeChange,
      nonce,
      rootId,
      finalDisplayName: displayName ?? getAssetDisplayName(src),
      startMediaFrom,
      src,
      playbackRate
    };
  }, [
    volumes,
    duration,
    doesVolumeChange,
    nonce,
    rootId,
    displayName,
    src,
    startMediaFrom,
    playbackRate
  ]);
  return memoizedResult;
};
var useMediaInTimeline = ({
  volume,
  mediaVolume,
  src,
  mediaType,
  playbackRate,
  displayName,
  id,
  getStack,
  showInTimeline,
  premountDisplay,
  postmountDisplay,
  loopDisplay,
  documentationLink
}) => {
  const parentSequence = (0, import_react50.useContext)(SequenceContext);
  const startsAt = useMediaStartsAt();
  const { registerSequence, unregisterSequence } = (0, import_react50.useContext)(SequenceManager);
  const { durationInFrames } = useVideoConfig();
  const mediaStartsAt = useMediaStartsAt();
  const { volumes, duration, doesVolumeChange, nonce, rootId, finalDisplayName } = useBasicMediaInTimeline({
    volume,
    mediaVolume,
    mediaType,
    src,
    displayName,
    trimAfter: void 0,
    trimBefore: void 0,
    playbackRate,
    sequenceDurationInFrames: durationInFrames,
    mediaStartsAt,
    loop: false
  });
  const { isStudio } = useRemotionEnvironment();
  (0, import_react50.useEffect)(() => {
    if (!src) {
      throw new Error("No src passed");
    }
    if (!isStudio && window.process?.env?.NODE_ENV !== "test") {
      return;
    }
    if (!showInTimeline) {
      return;
    }
    registerSequence({
      type: mediaType,
      src,
      id,
      duration,
      from: 0,
      parent: parentSequence?.id ?? null,
      displayName: finalDisplayName,
      documentationLink,
      rootId,
      volume: volumes,
      showInTimeline: true,
      nonce: nonce.get(),
      startMediaFrom: 0 - startsAt,
      doesVolumeChange,
      loopDisplay,
      playbackRate,
      getStack,
      premountDisplay,
      postmountDisplay,
      controls: null,
      effects: []
    });
    return () => {
      unregisterSequence(id);
    };
  }, [
    duration,
    id,
    parentSequence,
    src,
    registerSequence,
    unregisterSequence,
    volumes,
    doesVolumeChange,
    nonce,
    mediaType,
    startsAt,
    playbackRate,
    getStack,
    showInTimeline,
    premountDisplay,
    postmountDisplay,
    loopDisplay,
    documentationLink,
    rootId,
    finalDisplayName,
    isStudio
  ]);
};
var BufferingContextReact = import_react55.default.createContext(null);
var useIsPlayerBuffering = (bufferManager) => {
  const [isBuffering, setIsBuffering] = (0, import_react55.useState)(bufferManager.buffering.current);
  (0, import_react55.useEffect)(() => {
    const onBuffer = () => {
      setIsBuffering(true);
    };
    const onResume = () => {
      setIsBuffering(false);
    };
    bufferManager.listenForBuffering(onBuffer);
    bufferManager.listenForResume(onResume);
    return () => {
      bufferManager.listenForBuffering(() => {
        return;
      });
      bufferManager.listenForResume(() => {
        return;
      });
    };
  }, [bufferManager]);
  return isBuffering;
};
var useBufferState = () => {
  const buffer = (0, import_react54.useContext)(BufferingContextReact);
  const logLevel = useLogLevel();
  const addBlock = buffer ? buffer.addBlock : null;
  return (0, import_react54.useMemo)(() => ({
    delayPlayback: () => {
      if (!addBlock) {
        throw new Error("Tried to enable the buffering state, but a Remotion context was not found. This API can only be called in a component that was passed to the Remotion Player or a <Composition>. Or you might have experienced a version mismatch - run `npx remotion versions` and ensure all packages have the same version. This error is thrown by the buffer state https://remotion.dev/docs/player/buffer-state");
      }
      Log.trace({ logLevel, tag: "[buffer-state]" }, "Adding buffer handle", new Error().stack);
      const { unblock } = addBlock({
        id: String(Math.random())
      });
      let unblocked = false;
      return {
        unblock: () => {
          if (unblocked) {
            return;
          }
          unblocked = true;
          Log.trace({ logLevel, tag: "[buffer-state]" }, "Removing buffer handle");
          unblock();
        }
      };
    }
  }), [addBlock, logLevel]);
};
var isSafariWebkit = () => {
  const isSafari2 = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
  return isSafari2;
};
var useBufferUntilFirstFrame = ({
  mediaRef,
  mediaType,
  onVariableFpsVideoDetected,
  pauseWhenBuffering,
  logLevel,
  mountTime
}) => {
  const bufferingRef = (0, import_react53.useRef)(false);
  const { delayPlayback } = useBufferState();
  const bufferUntilFirstFrame = (0, import_react53.useCallback)((requestedTime) => {
    if (mediaType !== "video") {
      return;
    }
    if (!pauseWhenBuffering) {
      return;
    }
    const current = mediaRef.current;
    if (!current) {
      return;
    }
    if (current.readyState >= current.HAVE_FUTURE_DATA && !isSafariWebkit()) {
      playbackLogging({
        logLevel,
        message: `Not using buffer until first frame, because readyState is ${current.readyState} and is not Safari or Desktop Chrome`,
        mountTime,
        tag: "buffer"
      });
      return;
    }
    if (!current.requestVideoFrameCallback) {
      playbackLogging({
        logLevel,
        message: `Not using buffer until first frame, because requestVideoFrameCallback is not supported`,
        mountTime,
        tag: "buffer"
      });
      return;
    }
    bufferingRef.current = true;
    playbackLogging({
      logLevel,
      message: `Buffering ${mediaRef.current?.src} until the first frame is received`,
      mountTime,
      tag: "buffer"
    });
    const playback = delayPlayback();
    const unblock = () => {
      playback.unblock();
      current.removeEventListener("ended", unblock, {
        once: true
      });
      current.removeEventListener("pause", unblock, {
        once: true
      });
      bufferingRef.current = false;
    };
    const onEndedOrPauseOrCanPlay = () => {
      unblock();
    };
    current.requestVideoFrameCallback((_, info2) => {
      const differenceFromRequested = Math.abs(info2.mediaTime - requestedTime);
      if (differenceFromRequested > 0.5) {
        onVariableFpsVideoDetected();
      }
      unblock();
    });
    current.addEventListener("ended", onEndedOrPauseOrCanPlay, { once: true });
    current.addEventListener("pause", onEndedOrPauseOrCanPlay, { once: true });
    current.addEventListener("canplay", onEndedOrPauseOrCanPlay, {
      once: true
    });
  }, [
    delayPlayback,
    logLevel,
    mediaRef,
    mediaType,
    mountTime,
    onVariableFpsVideoDetected,
    pauseWhenBuffering
  ]);
  return (0, import_react53.useMemo)(() => {
    return {
      isBuffering: () => bufferingRef.current,
      bufferUntilFirstFrame
    };
  }, [bufferUntilFirstFrame]);
};
var useCurrentTimeOfMediaTagWithUpdateTimeStamp = (mediaRef) => {
  const lastUpdate = import_react56.default.useRef({
    time: mediaRef.current?.currentTime ?? 0,
    lastUpdate: performance.now()
  });
  const nowCurrentTime = mediaRef.current?.currentTime ?? null;
  if (nowCurrentTime !== null) {
    if (lastUpdate.current.time !== nowCurrentTime) {
      lastUpdate.current.time = nowCurrentTime;
      lastUpdate.current.lastUpdate = performance.now();
    }
  }
  return lastUpdate;
};
var seek = ({
  mediaRef,
  time,
  logLevel,
  why,
  mountTime
}) => {
  const timeToSet = isIosSafari() ? Number(time.toFixed(1)) : time;
  playbackLogging({
    logLevel,
    tag: "seek",
    message: `Seeking from ${mediaRef.currentTime} to ${timeToSet}. src= ${mediaRef.src} Reason: ${why}`,
    mountTime
  });
  mediaRef.currentTime = timeToSet;
  return timeToSet;
};
var useMediaBuffering = ({
  element,
  shouldBuffer,
  isPremounting,
  isPostmounting,
  logLevel,
  mountTime,
  src
}) => {
  const buffer = useBufferState();
  const [isBuffering, setIsBuffering] = (0, import_react57.useState)(false);
  (0, import_react57.useEffect)(() => {
    let cleanupFns = [];
    const { current } = element;
    if (!current) {
      return;
    }
    if (!shouldBuffer) {
      return;
    }
    if (isPremounting || isPostmounting) {
      if ((isPremounting || isPostmounting) && current.readyState < current.HAVE_FUTURE_DATA) {
        if (!navigator.userAgent.includes("Firefox/")) {
          playbackLogging({
            logLevel,
            message: `Calling .load() on ${current.src} because readyState is ${current.readyState} and it is not Firefox. Element is premounted ${current.playbackRate}`,
            tag: "load",
            mountTime
          });
          const previousPlaybackRate = current.playbackRate;
          current.load();
          current.playbackRate = previousPlaybackRate;
        }
      }
      return;
    }
    const cleanup = (reason) => {
      let didDoSomething = false;
      cleanupFns.forEach((fn) => {
        fn(reason);
        didDoSomething = true;
      });
      cleanupFns = [];
      setIsBuffering((previous) => {
        if (previous) {
          didDoSomething = true;
        }
        return false;
      });
      if (didDoSomething) {
        playbackLogging({
          logLevel,
          message: `Unmarking as buffering: ${current.src}. Reason: ${reason}`,
          tag: "buffer",
          mountTime
        });
      }
    };
    const blockMedia = (reason) => {
      setIsBuffering(true);
      playbackLogging({
        logLevel,
        message: `Marking as buffering: ${current.src}. Reason: ${reason}`,
        tag: "buffer",
        mountTime
      });
      const { unblock } = buffer.delayPlayback();
      const onCanPlay = () => {
        cleanup('"canplay" was fired');
        init();
      };
      const onError = () => {
        cleanup('"error" event was occurred');
        init();
      };
      current.addEventListener("canplay", onCanPlay, {
        once: true
      });
      cleanupFns.push(() => {
        current.removeEventListener("canplay", onCanPlay);
      });
      current.addEventListener("error", onError, {
        once: true
      });
      cleanupFns.push(() => {
        current.removeEventListener("error", onError);
      });
      cleanupFns.push((cleanupReason) => {
        playbackLogging({
          logLevel,
          message: `Unblocking ${current.src} from buffer. Reason: ${cleanupReason}`,
          tag: "buffer",
          mountTime
        });
        unblock();
      });
    };
    const init = () => {
      if (current.readyState < current.HAVE_FUTURE_DATA) {
        blockMedia(`readyState is ${current.readyState}, which is less than HAVE_FUTURE_DATA`);
        if (!navigator.userAgent.includes("Firefox/")) {
          playbackLogging({
            logLevel,
            message: `Calling .load() on ${src} because readyState is ${current.readyState} and it is not Firefox. ${current.playbackRate}`,
            tag: "load",
            mountTime
          });
          const previousPlaybackRate = current.playbackRate;
          current.load();
          current.playbackRate = previousPlaybackRate;
        }
      } else {
        const onWaiting = () => {
          blockMedia('"waiting" event was fired');
        };
        current.addEventListener("waiting", onWaiting);
        cleanupFns.push(() => {
          current.removeEventListener("waiting", onWaiting);
        });
      }
    };
    init();
    return () => {
      cleanup("element was unmounted or prop changed");
    };
  }, [
    buffer,
    src,
    element,
    isPremounting,
    isPostmounting,
    logLevel,
    shouldBuffer,
    mountTime
  ]);
  return isBuffering;
};
var useRequestVideoCallbackTime = ({
  mediaRef,
  mediaType,
  lastSeek,
  onVariableFpsVideoDetected
}) => {
  const currentTime = (0, import_react58.useRef)(null);
  (0, import_react58.useEffect)(() => {
    const { current } = mediaRef;
    if (current) {
      currentTime.current = {
        time: current.currentTime,
        lastUpdate: performance.now()
      };
    } else {
      currentTime.current = null;
      return;
    }
    if (mediaType !== "video") {
      currentTime.current = null;
      return;
    }
    const videoTag = current;
    if (!videoTag.requestVideoFrameCallback) {
      return;
    }
    let cancel = () => {
      return;
    };
    const request = () => {
      if (!videoTag) {
        return;
      }
      const cb = videoTag.requestVideoFrameCallback((_, info2) => {
        if (currentTime.current !== null) {
          const difference = Math.abs(currentTime.current.time - info2.mediaTime);
          const differenceToLastSeek = Math.abs(lastSeek.current === null ? Infinity : info2.mediaTime - lastSeek.current);
          if (difference > 0.5 && differenceToLastSeek > 0.5 && info2.mediaTime > currentTime.current.time) {
            onVariableFpsVideoDetected();
          }
        }
        currentTime.current = {
          time: info2.mediaTime,
          lastUpdate: performance.now()
        };
        request();
      });
      cancel = () => {
        videoTag.cancelVideoFrameCallback(cb);
        cancel = () => {
          return;
        };
      };
    };
    request();
    return () => {
      cancel();
    };
  }, [lastSeek, mediaRef, mediaType, onVariableFpsVideoDetected]);
  return currentTime;
};
function interpolateFunction(input, inputRange, outputRange, options) {
  const { extrapolateLeft, extrapolateRight, easing } = options;
  let result = input;
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;
  if (result < inputMin) {
    if (extrapolateLeft === "identity") {
      return result;
    }
    if (extrapolateLeft === "clamp") {
      result = inputMin;
    } else if (extrapolateLeft === "wrap") {
      const range = inputMax - inputMin;
      result = ((result - inputMin) % range + range) % range + inputMin;
    } else if (extrapolateLeft === "extend") {
    }
  }
  if (result > inputMax) {
    if (extrapolateRight === "identity") {
      return result;
    }
    if (extrapolateRight === "clamp") {
      result = inputMax;
    } else if (extrapolateRight === "wrap") {
      const range = inputMax - inputMin;
      result = ((result - inputMin) % range + range) % range + inputMin;
    } else if (extrapolateRight === "extend") {
    }
  }
  if (outputMin === outputMax) {
    return outputMin;
  }
  result = (result - inputMin) / (inputMax - inputMin);
  result = easing(result);
  result = result * (outputMax - outputMin) + outputMin;
  return result;
}
function findRange(input, inputRange) {
  let i;
  for (i = 1; i < inputRange.length - 1; ++i) {
    if (inputRange[i] >= input) {
      break;
    }
  }
  return i - 1;
}
function checkValidInputRange(arr) {
  for (let i = 1; i < arr.length; ++i) {
    if (!(arr[i] > arr[i - 1])) {
      throw new Error(`inputRange must be strictly monotonically increasing but got [${arr.join(",")}]`);
    }
  }
}
function checkInfiniteRange(name, arr) {
  if (arr.length < 2) {
    throw new Error(name + " must have at least 2 elements");
  }
  for (const element of arr) {
    if (typeof element !== "number") {
      throw new Error(`${name} must contain only numbers`);
    }
    if (!Number.isFinite(element)) {
      throw new Error(`${name} must contain only finite numbers, but got [${arr.join(",")}]`);
    }
  }
}
function assertValidInterpolateEasingOption(easing, inputRangeLength) {
  if (easing === void 0) {
    return;
  }
  if (typeof easing === "function") {
    return;
  }
  const expectedLength = inputRangeLength - 1;
  if (easing.length !== expectedLength) {
    throw new Error(`When easing is an array, it must have one entry per segment between keyframes (length inputRange.length - 1 = ${expectedLength}), but got length ${easing.length}`);
  }
  for (let i = 0; i < easing.length; i++) {
    if (typeof easing[i] !== "function") {
      throw new Error(`easing[${i}] must be a function`);
    }
  }
}
function interpolate(input, inputRange, outputRange, options) {
  if (typeof input === "undefined") {
    throw new Error("input can not be undefined");
  }
  if (typeof inputRange === "undefined") {
    throw new Error("inputRange can not be undefined");
  }
  if (typeof outputRange === "undefined") {
    throw new Error("outputRange can not be undefined");
  }
  if (inputRange.length !== outputRange.length) {
    throw new Error("inputRange (" + inputRange.length + ") and outputRange (" + outputRange.length + ") must have the same length");
  }
  checkInfiniteRange("inputRange", inputRange);
  checkInfiniteRange("outputRange", outputRange);
  checkValidInputRange(inputRange);
  assertValidInterpolateEasingOption(options?.easing, inputRange.length);
  const easingOption = options?.easing;
  const defaultEasing = (num) => num;
  const resolveEasingForSegment = (segmentIndex) => {
    if (easingOption === void 0) {
      return defaultEasing;
    }
    if (typeof easingOption === "function") {
      return easingOption;
    }
    return easingOption[segmentIndex];
  };
  let extrapolateLeft = "extend";
  if (options?.extrapolateLeft !== void 0) {
    extrapolateLeft = options.extrapolateLeft;
  }
  let extrapolateRight = "extend";
  if (options?.extrapolateRight !== void 0) {
    extrapolateRight = options.extrapolateRight;
  }
  if (typeof input !== "number") {
    throw new TypeError("Cannot interpolate an input which is not a number");
  }
  const range = findRange(input, inputRange);
  return interpolateFunction(input, [inputRange[range], inputRange[range + 1]], [outputRange[range], outputRange[range + 1]], {
    easing: resolveEasingForSegment(range),
    extrapolateLeft,
    extrapolateRight
  });
}
var getExpectedMediaFrameUncorrected = ({
  frame,
  playbackRate,
  startFrom
}) => {
  return interpolate(frame, [-1, startFrom, startFrom + 1], [-1, startFrom, startFrom + playbackRate]);
};
var getMediaTime = ({
  fps,
  frame,
  playbackRate,
  startFrom
}) => {
  const expectedFrame = getExpectedMediaFrameUncorrected({
    frame,
    playbackRate,
    startFrom
  });
  const msPerFrame = 1e3 / fps;
  return expectedFrame * msPerFrame / 1e3;
};
var alreadyWarned = {};
var warnAboutNonSeekableMedia = (ref, type) => {
  if (ref === null) {
    return;
  }
  if (ref.seekable.length === 0) {
    return;
  }
  if (ref.seekable.length > 1) {
    return;
  }
  if (alreadyWarned[ref.src]) {
    return;
  }
  const range = { start: ref.seekable.start(0), end: ref.seekable.end(0) };
  if (range.start === 0 && range.end === 0) {
    const msg = [
      `The media ${ref.src} cannot be seeked. This could be one of few reasons:`,
      "1) The media resource was replaced while the video is playing but it was not loaded yet.",
      "2) The media does not support seeking.",
      "3) The media was loaded with security headers prventing it from being included.",
      "Please see https://remotion.dev/docs/non-seekable-media for assistance."
    ].join(`
`);
    if (type === "console-error") {
      console.error(msg);
    } else if (type === "console-warning") {
      console.warn(`The media ${ref.src} does not support seeking. The video will render fine, but may not play correctly in the Remotion Studio and in the <Player>. See https://remotion.dev/docs/non-seekable-media for an explanation.`);
    } else {
      throw new Error(msg);
    }
    alreadyWarned[ref.src] = true;
  }
};
var useMediaPlayback = ({
  mediaRef,
  src,
  mediaType,
  playbackRate: localPlaybackRate,
  preservePitch = true,
  onlyWarnForMediaSeekingError,
  acceptableTimeshift,
  pauseWhenBuffering,
  isPremounting,
  isPostmounting,
  onAutoPlayError
}) => {
  const { playbackRate: globalPlaybackRate } = usePlaybackRate();
  const frame = useCurrentFrame();
  const absoluteFrame = useTimelinePosition();
  const [playing] = usePlayingState();
  const buffering = (0, import_react52.useContext)(BufferingContextReact);
  const { fps } = useVideoConfig();
  const mediaStartsAt = useMediaStartsAt();
  const lastSeekDueToShift = (0, import_react52.useRef)(null);
  const lastSeek = (0, import_react52.useRef)(null);
  const logLevel = useLogLevel();
  const mountTime = useMountTime();
  if (!buffering) {
    throw new Error("useMediaPlayback must be used inside a <BufferingContext>");
  }
  const isVariableFpsVideoMap = (0, import_react52.useRef)({});
  const onVariableFpsVideoDetected = (0, import_react52.useCallback)(() => {
    if (!src) {
      return;
    }
    if (isVariableFpsVideoMap.current[src]) {
      return;
    }
    Log.verbose({ logLevel, tag: null }, `Detected ${src} as a variable FPS video. Disabling buffering while seeking.`);
    isVariableFpsVideoMap.current[src] = true;
  }, [logLevel, src]);
  const rvcCurrentTime = useRequestVideoCallbackTime({
    mediaRef,
    mediaType,
    lastSeek,
    onVariableFpsVideoDetected
  });
  const mediaTagCurrentTime = useCurrentTimeOfMediaTagWithUpdateTimeStamp(mediaRef);
  const desiredUnclampedTime = getMediaTime({
    frame,
    playbackRate: localPlaybackRate,
    startFrom: -mediaStartsAt,
    fps
  });
  const isMediaTagBuffering = useMediaBuffering({
    element: mediaRef,
    shouldBuffer: pauseWhenBuffering,
    isPremounting,
    isPostmounting,
    logLevel,
    mountTime,
    src: src ?? null
  });
  const { bufferUntilFirstFrame, isBuffering } = useBufferUntilFirstFrame({
    mediaRef,
    mediaType,
    onVariableFpsVideoDetected,
    pauseWhenBuffering,
    logLevel,
    mountTime
  });
  const playbackRate = localPlaybackRate * globalPlaybackRate;
  const acceptableTimeShiftButLessThanDuration = (() => {
    const DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_NORMAL_PLAYBACK = 0.45;
    const DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_AMPLIFICATION = DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_NORMAL_PLAYBACK + 0.2;
    const defaultAcceptableTimeshift = DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_AMPLIFICATION;
    if (mediaRef.current?.duration) {
      return Math.min(mediaRef.current.duration, acceptableTimeshift ?? defaultAcceptableTimeshift);
    }
    return acceptableTimeshift ?? defaultAcceptableTimeshift;
  })();
  const isPlayerBuffering = useIsPlayerBuffering(buffering);
  (0, import_react52.useEffect)(() => {
    if (mediaRef.current?.paused) {
      return;
    }
    if (!playing) {
      playbackLogging({
        logLevel,
        tag: "pause",
        message: `Pausing ${mediaRef.current?.src} because ${isPremounting ? "media is premounting" : isPostmounting ? "media is postmounting" : "Player is not playing"}`,
        mountTime
      });
      mediaRef.current?.pause();
      return;
    }
    const isMediaTagBufferingOrStalled = isMediaTagBuffering || isBuffering();
    const playerBufferingNotStateButLive = buffering.buffering.current;
    if (playerBufferingNotStateButLive && !isMediaTagBufferingOrStalled) {
      playbackLogging({
        logLevel,
        tag: "pause",
        message: `Pausing ${mediaRef.current?.src} because player is buffering but media tag is not`,
        mountTime
      });
      mediaRef.current?.pause();
    }
  }, [
    isBuffering,
    isMediaTagBuffering,
    buffering,
    isPlayerBuffering,
    isPremounting,
    logLevel,
    mediaRef,
    mediaType,
    mountTime,
    playing,
    isPostmounting
  ]);
  const env = useRemotionEnvironment();
  (0, import_react52.useLayoutEffect)(() => {
    const playbackRateToSet = Math.max(0, playbackRate);
    if (mediaRef.current && mediaRef.current.playbackRate !== playbackRateToSet) {
      mediaRef.current.playbackRate = playbackRateToSet;
    }
    if (mediaRef.current && mediaRef.current.preservesPitch !== preservePitch) {
      mediaRef.current.preservesPitch = preservePitch;
    }
  }, [mediaRef, playbackRate, preservePitch]);
  (0, import_react52.useEffect)(() => {
    const tagName = mediaType === "audio" ? "<Html5Audio>" : "<Html5Video>";
    if (!mediaRef.current) {
      throw new Error(`No ${mediaType} ref found`);
    }
    if (!src) {
      throw new Error(`No 'src' attribute was passed to the ${tagName} element.`);
    }
    const { duration } = mediaRef.current;
    const shouldBeTime = !Number.isNaN(duration) && Number.isFinite(duration) ? Math.min(duration, desiredUnclampedTime) : desiredUnclampedTime;
    const mediaTagTime = mediaTagCurrentTime.current.time;
    const rvcTime = rvcCurrentTime.current?.time ?? null;
    const isVariableFpsVideo = isVariableFpsVideoMap.current[src];
    const timeShiftMediaTag = Math.abs(shouldBeTime - mediaTagTime);
    const timeShiftRvcTag = rvcTime ? Math.abs(shouldBeTime - rvcTime) : null;
    const mostRecentTimeshift = rvcCurrentTime.current?.lastUpdate && rvcCurrentTime.current.time > mediaTagCurrentTime.current.lastUpdate ? timeShiftRvcTag : timeShiftMediaTag;
    const timeShift = timeShiftRvcTag && !isVariableFpsVideo ? mostRecentTimeshift : timeShiftMediaTag;
    if (timeShift > acceptableTimeShiftButLessThanDuration && lastSeekDueToShift.current !== shouldBeTime) {
      lastSeek.current = seek({
        mediaRef: mediaRef.current,
        time: shouldBeTime,
        logLevel,
        why: `because time shift is too big. shouldBeTime = ${shouldBeTime}, isTime = ${mediaTagTime}, requestVideoCallbackTime = ${rvcTime}, timeShift = ${timeShift}${isVariableFpsVideo ? ", isVariableFpsVideo = true" : ""}, isPremounting = ${isPremounting}, isPostmounting = ${isPostmounting}, pauseWhenBuffering = ${pauseWhenBuffering}`,
        mountTime
      });
      lastSeekDueToShift.current = lastSeek.current;
      if (playing) {
        if (playbackRate > 0) {
          bufferUntilFirstFrame(shouldBeTime);
        }
        if (mediaRef.current.paused) {
          playAndHandleNotAllowedError({
            mediaRef,
            mediaType,
            onAutoPlayError,
            logLevel,
            mountTime,
            reason: "player is playing but media tag is paused, and just seeked",
            isPlayer: env.isPlayer
          });
        }
      }
      if (!onlyWarnForMediaSeekingError) {
        warnAboutNonSeekableMedia(mediaRef.current, onlyWarnForMediaSeekingError ? "console-warning" : "console-error");
      }
      return;
    }
    const seekThreshold = playing ? 0.15 : 0.01;
    const makesSenseToSeek = Math.abs(mediaRef.current.currentTime - shouldBeTime) > seekThreshold;
    const isMediaTagBufferingOrStalled = isMediaTagBuffering || isBuffering();
    const isSomethingElseBuffering = buffering.buffering.current && !isMediaTagBufferingOrStalled;
    if (!playing || isSomethingElseBuffering) {
      if (makesSenseToSeek) {
        lastSeek.current = seek({
          mediaRef: mediaRef.current,
          time: shouldBeTime,
          logLevel,
          why: `not playing or something else is buffering. time offset is over seek threshold (${seekThreshold})`,
          mountTime
        });
      }
      return;
    }
    if (!playing || buffering.buffering.current) {
      return;
    }
    const pausedCondition = mediaRef.current.paused && !mediaRef.current.ended;
    const firstFrameCondition = absoluteFrame === 0;
    if (pausedCondition || firstFrameCondition) {
      const reason = pausedCondition ? "media tag is paused" : "absolute frame is 0";
      if (makesSenseToSeek) {
        lastSeek.current = seek({
          mediaRef: mediaRef.current,
          time: shouldBeTime,
          logLevel,
          why: `is over timeshift threshold (threshold = ${seekThreshold}) and ${reason}`,
          mountTime
        });
      }
      playAndHandleNotAllowedError({
        mediaRef,
        mediaType,
        onAutoPlayError,
        logLevel,
        mountTime,
        reason: `player is playing and ${reason}`,
        isPlayer: env.isPlayer
      });
      if (!isVariableFpsVideo && playbackRate > 0) {
        bufferUntilFirstFrame(shouldBeTime);
      }
    }
  }, [
    absoluteFrame,
    acceptableTimeShiftButLessThanDuration,
    bufferUntilFirstFrame,
    buffering.buffering,
    rvcCurrentTime,
    logLevel,
    desiredUnclampedTime,
    isBuffering,
    isMediaTagBuffering,
    mediaRef,
    mediaType,
    onlyWarnForMediaSeekingError,
    playbackRate,
    playing,
    src,
    onAutoPlayError,
    isPremounting,
    isPostmounting,
    pauseWhenBuffering,
    mountTime,
    mediaTagCurrentTime,
    env.isPlayer
  ]);
};
var useMediaTag = ({
  mediaRef,
  id,
  mediaType,
  onAutoPlayError,
  isPremounting,
  isPostmounting
}) => {
  const { audioAndVideoTags, imperativePlaying } = useTimelineContext();
  const logLevel = useLogLevel();
  const mountTime = useMountTime();
  const env = useRemotionEnvironment();
  (0, import_react59.useEffect)(() => {
    const tag = {
      id,
      play: (reason) => {
        if (!imperativePlaying.current) {
          return;
        }
        if (isPremounting || isPostmounting) {
          return;
        }
        return playAndHandleNotAllowedError({
          mediaRef,
          mediaType,
          onAutoPlayError,
          logLevel,
          mountTime,
          reason,
          isPlayer: env.isPlayer
        });
      }
    };
    audioAndVideoTags.current.push(tag);
    return () => {
      audioAndVideoTags.current = audioAndVideoTags.current.filter((a2) => a2.id !== id);
    };
  }, [
    audioAndVideoTags,
    id,
    mediaRef,
    mediaType,
    onAutoPlayError,
    imperativePlaying,
    isPremounting,
    isPostmounting,
    logLevel,
    mountTime,
    env.isPlayer
  ]);
};
var MediaVolumeContext = (0, import_react60.createContext)({
  mediaMuted: false,
  mediaVolume: 1
});
var SetMediaVolumeContext = (0, import_react60.createContext)({
  setMediaMuted: () => {
    throw new Error("default");
  },
  setMediaVolume: () => {
    throw new Error("default");
  }
});
var useMediaVolumeState = () => {
  const { mediaVolume } = (0, import_react60.useContext)(MediaVolumeContext);
  const { setMediaVolume } = (0, import_react60.useContext)(SetMediaVolumeContext);
  return (0, import_react60.useMemo)(() => {
    return [mediaVolume, setMediaVolume];
  }, [mediaVolume, setMediaVolume]);
};
var useMediaMutedState = () => {
  const { mediaMuted } = (0, import_react60.useContext)(MediaVolumeContext);
  const { setMediaMuted } = (0, import_react60.useContext)(SetMediaVolumeContext);
  return (0, import_react60.useMemo)(() => {
    return [mediaMuted, setMediaMuted];
  }, [mediaMuted, setMediaMuted]);
};
var warnAboutTooHighVolume = (volume) => {
  if (volume >= 100) {
    throw new Error(`Volume was set to ${volume}, but regular volume is 1, not 100. Did you forget to divide by 100? Set a volume of less than 100 to dismiss this error.`);
  }
};
var AudioForDevelopmentForwardRefFunction = (props, ref) => {
  const [initialShouldPreMountAudioElements] = (0, import_react45.useState)(props.shouldPreMountAudioTags);
  if (props.shouldPreMountAudioTags !== initialShouldPreMountAudioElements) {
    throw new Error("Cannot change the behavior for pre-mounting audio tags dynamically.");
  }
  const logLevel = useLogLevel();
  const {
    volume,
    muted,
    playbackRate,
    preservePitch,
    shouldPreMountAudioTags,
    src,
    onDuration,
    acceptableTimeShiftInSeconds,
    _remotionInternalNeedsDurationCalculation,
    _remotionInternalNativeLoopPassed,
    _remotionInternalStack,
    allowAmplificationDuringRender,
    name,
    pauseWhenBuffering,
    showInTimeline,
    loopVolumeCurveBehavior,
    stack,
    crossOrigin,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    toneFrequency,
    useWebAudioApi,
    onError,
    onNativeError,
    audioStreamIndex,
    ...nativeProps
  } = props;
  const _propsValid = true;
  if (!_propsValid) {
    throw new Error("typecheck error");
  }
  const [mediaVolume] = useMediaVolumeState();
  const [mediaMuted] = useMediaMutedState();
  const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
  if (!src) {
    throw new TypeError("No 'src' was passed to <Html5Audio>.");
  }
  const preloadedSrc = usePreload(src);
  const sequenceContext = (0, import_react45.useContext)(SequenceContext);
  const [timelineId] = (0, import_react45.useState)(() => String(Math.random()));
  const userPreferredVolume = evaluateVolume({
    frame: volumePropFrame,
    volume,
    mediaVolume
  });
  warnAboutTooHighVolume(userPreferredVolume);
  const crossOriginValue = getCrossOriginValue({
    crossOrigin,
    requestsVideoFrame: false,
    isClientSideRendering: false
  });
  const propsToPass = (0, import_react45.useMemo)(() => {
    return {
      muted: muted || mediaMuted || userPreferredVolume <= 0,
      src: preloadedSrc,
      loop: _remotionInternalNativeLoopPassed,
      crossOrigin: crossOriginValue,
      ...nativeProps
    };
  }, [
    _remotionInternalNativeLoopPassed,
    mediaMuted,
    muted,
    nativeProps,
    preloadedSrc,
    userPreferredVolume,
    crossOriginValue
  ]);
  const id = (0, import_react45.useMemo)(() => `audio-${random(src ?? "")}-${sequenceContext?.relativeFrom}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.durationInFrames}-muted:${props.muted}-loop:${props.loop}`, [
    src,
    sequenceContext?.relativeFrom,
    sequenceContext?.cumulatedFrom,
    sequenceContext?.durationInFrames,
    props.muted,
    props.loop
  ]);
  const {
    el: audioRef,
    mediaElementSourceNode,
    cleanupOnMediaTagUnmount
  } = useSharedAudio({
    aud: propsToPass,
    audioId: id,
    premounting: Boolean(sequenceContext?.premounting),
    postmounting: Boolean(sequenceContext?.postmounting)
  });
  const getStack = (0, import_react44.useCallback)(() => {
    return _remotionInternalStack ?? null;
  }, [_remotionInternalStack]);
  useMediaInTimeline({
    volume,
    mediaVolume,
    src,
    mediaType: "audio",
    playbackRate: playbackRate ?? 1,
    displayName: name ?? null,
    id: timelineId,
    getStack,
    showInTimeline,
    premountDisplay: sequenceContext?.premountDisplay ?? null,
    postmountDisplay: sequenceContext?.postmountDisplay ?? null,
    loopDisplay: void 0,
    documentationLink: name === void 0 ? "https://www.remotion.dev/docs/html5-audio" : null
  });
  useMediaPlayback({
    mediaRef: audioRef,
    src,
    mediaType: "audio",
    playbackRate: playbackRate ?? 1,
    preservePitch,
    onlyWarnForMediaSeekingError: false,
    acceptableTimeshift: acceptableTimeShiftInSeconds ?? null,
    isPremounting: Boolean(sequenceContext?.premounting),
    isPostmounting: Boolean(sequenceContext?.postmounting),
    pauseWhenBuffering,
    onAutoPlayError: null
  });
  useMediaTag({
    id: timelineId,
    isPostmounting: Boolean(sequenceContext?.postmounting),
    isPremounting: Boolean(sequenceContext?.premounting),
    mediaRef: audioRef,
    mediaType: "audio",
    onAutoPlayError: null
  });
  useVolume({
    logLevel,
    mediaRef: audioRef,
    source: mediaElementSourceNode,
    volume: userPreferredVolume,
    shouldUseWebAudioApi: useWebAudioApi ?? false
  });
  const effectToUse = import_react45.default.useInsertionEffect ?? import_react45.default.useLayoutEffect;
  effectToUse(() => {
    return () => {
      requestAnimationFrame(() => {
        cleanupOnMediaTagUnmount();
      });
    };
  }, [cleanupOnMediaTagUnmount]);
  (0, import_react45.useImperativeHandle)(ref, () => {
    return audioRef.current;
  }, [audioRef]);
  const currentOnDurationCallback = (0, import_react45.useRef)(onDuration);
  currentOnDurationCallback.current = onDuration;
  (0, import_react45.useEffect)(() => {
    const { current } = audioRef;
    if (!current) {
      return;
    }
    if (current.duration) {
      currentOnDurationCallback.current?.(current.src, current.duration);
      return;
    }
    const onLoadedMetadata = () => {
      currentOnDurationCallback.current?.(current.src, current.duration);
    };
    current.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      current.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [audioRef, src]);
  if (initialShouldPreMountAudioElements) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("audio", {
    ref: audioRef,
    preload: "metadata",
    crossOrigin: crossOriginValue,
    ...propsToPass
  });
};
var AudioForPreview = (0, import_react45.forwardRef)(AudioForDevelopmentForwardRefFunction);
var AudioForRenderingRefForwardingFunction = (props, ref) => {
  const audioRef = (0, import_react61.useRef)(null);
  const {
    volume: volumeProp,
    playbackRate,
    allowAmplificationDuringRender,
    onDuration,
    toneFrequency,
    _remotionInternalNeedsDurationCalculation,
    _remotionInternalNativeLoopPassed,
    acceptableTimeShiftInSeconds,
    name,
    onNativeError,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    loopVolumeCurveBehavior,
    pauseWhenBuffering,
    audioStreamIndex,
    preservePitch: _preservePitch,
    ...nativeProps
  } = props;
  const absoluteFrame = useTimelinePosition();
  const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
  const frame = useCurrentFrame();
  const sequenceContext = (0, import_react61.useContext)(SequenceContext);
  const { registerRenderAsset, unregisterRenderAsset } = (0, import_react61.useContext)(RenderAssetManager);
  const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
  const id = (0, import_react61.useMemo)(() => `audio-${random(props.src ?? "")}-${sequenceContext?.relativeFrom}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.durationInFrames}`, [
    props.src,
    sequenceContext?.relativeFrom,
    sequenceContext?.cumulatedFrom,
    sequenceContext?.durationInFrames
  ]);
  const volume = evaluateVolume({
    volume: volumeProp,
    frame: volumePropFrame,
    mediaVolume: 1
  });
  warnAboutTooHighVolume(volume);
  (0, import_react61.useImperativeHandle)(ref, () => {
    return audioRef.current;
  }, []);
  (0, import_react61.useEffect)(() => {
    if (!props.src) {
      throw new Error("No src passed");
    }
    if (!window.remotion_audioEnabled) {
      return;
    }
    if (props.muted) {
      return;
    }
    if (volume <= 0) {
      return;
    }
    registerRenderAsset({
      type: "audio",
      src: getAbsoluteSrc(props.src),
      id,
      frame: absoluteFrame,
      volume,
      mediaFrame: frame,
      playbackRate: props.playbackRate ?? 1,
      toneFrequency: toneFrequency ?? 1,
      audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
      audioStreamIndex: audioStreamIndex ?? 0
    });
    return () => unregisterRenderAsset(id);
  }, [
    props.muted,
    props.src,
    registerRenderAsset,
    absoluteFrame,
    id,
    unregisterRenderAsset,
    volume,
    volumePropFrame,
    frame,
    playbackRate,
    props.playbackRate,
    toneFrequency,
    sequenceContext?.cumulatedNegativeFrom,
    audioStreamIndex
  ]);
  const { src } = props;
  const needsToRenderAudioTag = ref || _remotionInternalNeedsDurationCalculation;
  (0, import_react61.useLayoutEffect)(() => {
    if (window.process?.env?.NODE_ENV === "test") {
      return;
    }
    if (!needsToRenderAudioTag) {
      return;
    }
    const newHandle = delayRender2("Loading <Html5Audio> duration with src=" + src, {
      retries: delayRenderRetries ?? void 0,
      timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
    });
    const { current } = audioRef;
    const didLoad = () => {
      if (current?.duration) {
        onDuration(current.src, current.duration);
      }
      continueRender2(newHandle);
    };
    if (current?.duration) {
      onDuration(current.src, current.duration);
      continueRender2(newHandle);
    } else {
      current?.addEventListener("loadedmetadata", didLoad, { once: true });
    }
    return () => {
      current?.removeEventListener("loadedmetadata", didLoad);
      continueRender2(newHandle);
    };
  }, [
    src,
    onDuration,
    needsToRenderAudioTag,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    continueRender2,
    delayRender2
  ]);
  if (!needsToRenderAudioTag) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("audio", {
    ref: audioRef,
    ...nativeProps,
    onError: onNativeError
  });
};
var AudioForRendering = (0, import_react61.forwardRef)(AudioForRenderingRefForwardingFunction);
var AudioRefForwardingFunction = (props, ref) => {
  const audioTagsContext = (0, import_react39.useContext)(SharedAudioTagsContext);
  const {
    startFrom,
    endAt,
    trimBefore,
    trimAfter,
    name,
    stack,
    pauseWhenBuffering,
    showInTimeline,
    onError: onRemotionError,
    ...otherProps
  } = props;
  const { loop, ...propsOtherThanLoop } = props;
  const { fps } = useVideoConfig();
  const environment = useRemotionEnvironment();
  if (environment.isClientSideRendering) {
    throw new Error("<Html5Audio> is not supported in @remotion/web-renderer. Use <Audio> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
  }
  const { durations, setDurations } = (0, import_react39.useContext)(DurationsContext);
  if (typeof props.src !== "string") {
    throw new TypeError(`The \`<Html5Audio>\` tag requires a string for \`src\`, but got ${JSON.stringify(props.src)} instead.`);
  }
  const preloadedSrc = usePreload(props.src);
  const onError = (0, import_react39.useCallback)((e) => {
    console.log(e.currentTarget.error);
    const errMessage = `Could not play audio with src ${preloadedSrc}: ${e.currentTarget.error}. See https://remotion.dev/docs/media-playback-error for help.`;
    if (loop) {
      if (onRemotionError) {
        onRemotionError(new Error(errMessage));
        return;
      }
      cancelRender(new Error(errMessage));
    } else {
      onRemotionError?.(new Error(errMessage));
      console.warn(errMessage);
    }
  }, [loop, onRemotionError, preloadedSrc]);
  const onDuration = (0, import_react39.useCallback)((src, durationInSeconds) => {
    setDurations({ type: "got-duration", durationInSeconds, src });
  }, [setDurations]);
  const durationFetched = durations[getAbsoluteSrc(preloadedSrc)] ?? durations[getAbsoluteSrc(props.src)];
  validateMediaTrimProps({ startFrom, endAt, trimBefore, trimAfter });
  const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
    startFrom,
    endAt,
    trimBefore,
    trimAfter
  });
  if (loop && durationFetched !== void 0) {
    if (!Number.isFinite(durationFetched)) {
      return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Html5Audio, {
        ...propsOtherThanLoop,
        ref,
        _remotionInternalNativeLoopPassed: true
      });
    }
    const duration = durationFetched * fps;
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Loop, {
      layout: "none",
      durationInFrames: calculateMediaDuration({
        trimAfter: trimAfterValue,
        mediaDurationInFrames: duration,
        playbackRate: props.playbackRate ?? 1,
        trimBefore: trimBeforeValue
      }),
      children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Html5Audio, {
        ...propsOtherThanLoop,
        ref,
        _remotionInternalNativeLoopPassed: true
      })
    });
  }
  if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") {
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Sequence, {
      layout: "none",
      from: 0 - (trimBeforeValue ?? 0),
      showInTimeline: false,
      durationInFrames: trimAfterValue,
      name,
      children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Html5Audio, {
        _remotionInternalNeedsDurationCalculation: Boolean(loop),
        pauseWhenBuffering: pauseWhenBuffering ?? false,
        ...otherProps,
        ref
      })
    });
  }
  validateMediaProps({
    playbackRate: props.playbackRate,
    preservePitch: props.preservePitch,
    volume: props.volume
  }, "Html5Audio");
  if (environment.isRendering) {
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AudioForRendering, {
      onDuration,
      ...props,
      ref,
      onNativeError: onError,
      _remotionInternalNeedsDurationCalculation: Boolean(loop)
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AudioForPreview, {
    _remotionInternalNativeLoopPassed: props._remotionInternalNativeLoopPassed ?? false,
    _remotionInternalStack: stack ?? null,
    shouldPreMountAudioTags: audioTagsContext !== null && audioTagsContext.numberOfAudioTags > 0,
    ...props,
    ref,
    onNativeError: onError,
    onDuration,
    pauseWhenBuffering: pauseWhenBuffering ?? false,
    _remotionInternalNeedsDurationCalculation: Boolean(loop),
    showInTimeline: showInTimeline ?? true
  });
};
var Html5Audio = (0, import_react39.forwardRef)(AudioRefForwardingFunction);
addSequenceStackTraces(Html5Audio);
function exponentialBackoff(errorCount) {
  return 1e3 * 2 ** (errorCount - 1);
}
function truncateSrcForLabel(src) {
  if (src.startsWith("data:") && src.length > 100) {
    return src.slice(0, 60) + "...[" + src.length + " chars total]";
  }
  return src;
}
var ImgContent = ({
  onError,
  maxRetries = 2,
  src,
  pauseWhenLoading,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  onImageFrame,
  crossOrigin,
  decoding,
  ref,
  ...props2
}) => {
  const imageRef = (0, import_react63.useRef)(null);
  const errors = (0, import_react63.useRef)({});
  const { delayPlayback } = useBufferState();
  const sequenceContext = (0, import_react63.useContext)(SequenceContext);
  const _propsValid = true;
  if (!_propsValid) {
    throw new Error("typecheck error");
  }
  (0, import_react63.useImperativeHandle)(ref, () => {
    return imageRef.current;
  }, []);
  const actualSrc = usePreload(src);
  const retryIn = (0, import_react63.useCallback)((timeout) => {
    if (!imageRef.current) {
      return;
    }
    const currentSrc = imageRef.current.src;
    setTimeout(() => {
      if (!imageRef.current) {
        return;
      }
      const newSrc = imageRef.current?.src;
      if (newSrc !== currentSrc) {
        return;
      }
      imageRef.current.removeAttribute("src");
      imageRef.current.setAttribute("src", newSrc);
    }, timeout);
  }, []);
  const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
  const didGetError = (0, import_react63.useCallback)((e) => {
    if (!errors.current) {
      return;
    }
    errors.current[imageRef.current?.src] = (errors.current[imageRef.current?.src] ?? 0) + 1;
    if (onError && (errors.current[imageRef.current?.src] ?? 0) > maxRetries) {
      onError(e);
      return;
    }
    if ((errors.current[imageRef.current?.src] ?? 0) <= maxRetries) {
      const backoff = exponentialBackoff(errors.current[imageRef.current?.src] ?? 0);
      console.warn(`Could not load image with source ${truncateSrcForLabel(imageRef.current?.src)}, retrying again in ${backoff}ms`);
      retryIn(backoff);
      return;
    }
    try {
      cancelRender2("Error loading image with src: " + truncateSrcForLabel(imageRef.current?.src));
    } catch {
    }
  }, [cancelRender2, maxRetries, onError, retryIn]);
  if (typeof window !== "undefined") {
    const isPremounting = Boolean(sequenceContext?.premounting);
    const isPostmounting = Boolean(sequenceContext?.postmounting);
    (0, import_react63.useLayoutEffect)(() => {
      if (window.process?.env?.NODE_ENV === "test") {
        if (imageRef.current) {
          imageRef.current.src = actualSrc;
        }
        return;
      }
      const { current } = imageRef;
      if (!current) {
        return;
      }
      const newHandle = delayRender2("Loading <Img> with src=" + truncateSrcForLabel(actualSrc), {
        retries: delayRenderRetries ?? void 0,
        timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
      });
      const unblock = pauseWhenLoading && !isPremounting && !isPostmounting ? delayPlayback().unblock : () => {
        return;
      };
      let unmounted = false;
      const onComplete = () => {
        if (unmounted) {
          continueRender2(newHandle);
          return;
        }
        if ((errors.current[imageRef.current?.src] ?? 0) > 0) {
          delete errors.current[imageRef.current?.src];
          console.info(`Retry successful - ${truncateSrcForLabel(imageRef.current?.src)} is now loaded`);
        }
        if (current) {
          onImageFrame?.(current);
        }
        unblock();
        continueRender2(newHandle);
      };
      if (!imageRef.current) {
        onComplete();
        return;
      }
      current.src = actualSrc;
      current.decode().then(onComplete).catch((err) => {
        console.warn(err);
        if (current.complete && current.naturalWidth > 0 && current.naturalHeight > 0) {
          onComplete();
        } else {
          current.addEventListener("load", onComplete);
        }
      });
      return () => {
        unmounted = true;
        current.removeEventListener("load", onComplete);
        unblock();
        continueRender2(newHandle);
      };
    }, [
      actualSrc,
      delayPlayback,
      delayRenderRetries,
      delayRenderTimeoutInMilliseconds,
      pauseWhenLoading,
      isPremounting,
      isPostmounting,
      onImageFrame,
      continueRender2,
      delayRender2
    ]);
  }
  const { isClientSideRendering, isRendering } = useRemotionEnvironment();
  const crossOriginValue = getCrossOriginValue({
    crossOrigin,
    requestsVideoFrame: false,
    isClientSideRendering
  });
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("img", {
    ...props2,
    ref: imageRef,
    crossOrigin: crossOriginValue,
    onError: didGetError,
    decoding: isRendering ? "sync" : decoding
  });
};
var ImgInner = ({
  hidden,
  name,
  stack,
  showInTimeline,
  src,
  from,
  durationInFrames,
  _experimentalControls: controls,
  ...props2
}) => {
  if (!src) {
    throw new Error('No "src" prop was passed to <Img>.');
  }
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Sequence, {
    layout: "none",
    from: from ?? 0,
    durationInFrames: durationInFrames ?? Infinity,
    _remotionInternalStack: stack,
    _remotionInternalDocumentationLink: name === void 0 ? "https://www.remotion.dev/docs/img" : void 0,
    _remotionInternalIsMedia: { type: "image", src },
    name: name ?? "<Img>",
    _experimentalControls: controls,
    showInTimeline: showInTimeline ?? true,
    hidden,
    children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(ImgContent, {
      src,
      ...props2
    })
  });
};
var imgSchema = {
  ...sequenceVisualStyleSchema,
  hidden: hiddenField
};
var Img = wrapInSchema(ImgInner, imgSchema);
addSequenceStackTraces(Img);
var canvasImageSchema = {
  fit: {
    type: "enum",
    default: "fill",
    description: "Fit",
    variants: {
      fill: {},
      contain: {},
      cover: {}
    }
  },
  ...sequenceVisualStyleSchema,
  hidden: hiddenField
};
var makeAbortError = () => {
  if (typeof DOMException !== "undefined") {
    return new DOMException("Image loading was aborted", "AbortError");
  }
  const error2 = new Error("Image loading was aborted");
  error2.name = "AbortError";
  return error2;
};
var loadImage = ({
  src,
  signal
}) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    function cleanup() {
      image.onload = null;
      image.onerror = null;
    }
    function settle(callback) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    }
    function onAbort() {
      settle(() => reject(makeAbortError()));
    }
    image.onload = () => {
      Promise.resolve(image.decode?.()).catch(() => {
        return;
      }).then(() => {
        const imageWidth = image.naturalWidth || image.width;
        const imageHeight = image.naturalHeight || image.height;
        if (imageWidth <= 0 || imageHeight <= 0) {
          settle(() => reject(new Error(`Could not determine dimensions for <CanvasImage> with src="${truncateSrcForLabel(src)}"`)));
          return;
        }
        settle(() => resolve({ element: image, width: imageWidth, height: imageHeight }));
      });
    };
    image.onerror = () => {
      settle(() => reject(new Error(`Could not load <CanvasImage> with src="${truncateSrcForLabel(src)}"`)));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    image.crossOrigin = "anonymous";
    image.src = src;
  });
};
function exponentialBackoff2(errorCount) {
  return 1e3 * 2 ** (errorCount - 1);
}
var CanvasImageContent = (0, import_react62.forwardRef)(({
  src,
  width,
  height,
  fit = "fill",
  effects,
  controls,
  onError,
  className,
  style,
  id,
  pauseWhenLoading,
  maxRetries = 2,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds
}, ref) => {
  const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
  const { delayPlayback } = useBufferState();
  const [outputCanvas, setOutputCanvas] = (0, import_react62.useState)(null);
  const actualSrc = usePreload(src);
  const chainState = useEffectChainState();
  const memoizedEffects = useMemoizedEffects({
    effects,
    overrideId: controls?.overrideId ?? null
  });
  const sequenceContext = (0, import_react62.useContext)(SequenceContext);
  const sourceCanvas = (0, import_react62.useMemo)(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.createElement("canvas");
  }, []);
  const canvasRef = (0, import_react62.useCallback)((canvas) => {
    setOutputCanvas(canvas);
    if (typeof ref === "function") {
      ref(canvas);
    } else if (ref) {
      ref.current = canvas;
    }
  }, [ref]);
  (0, import_react62.useEffect)(() => {
    if (!outputCanvas || !sourceCanvas) {
      return;
    }
    const isPremounting = Boolean(sequenceContext?.premounting);
    const isPostmounting = Boolean(sequenceContext?.postmounting);
    const handle = delayRender2(`Rendering <CanvasImage> with src="${truncateSrcForLabel(actualSrc)}"`, {
      retries: delayRenderRetries ?? void 0,
      timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
    });
    const unblock = pauseWhenLoading && !isPremounting && !isPostmounting ? delayPlayback().unblock : () => {
      return;
    };
    const controller = new AbortController();
    let cancelled = false;
    let continued = false;
    let errorCount = 0;
    let timeoutId = null;
    const continueRenderOnce = () => {
      if (continued) {
        return;
      }
      continued = true;
      unblock();
      continueRender2(handle);
    };
    const attemptLoad = () => {
      loadImage({ src: actualSrc, signal: controller.signal }).then((image) => {
        if (cancelled) {
          return;
        }
        const canvasWidth = width ?? image.width;
        const canvasHeight = height ?? image.height;
        const sourceContext = sourceCanvas.getContext("2d", {
          colorSpace: "srgb"
        });
        if (!sourceContext) {
          throw new Error("Could not get 2D context for <CanvasImage> source canvas");
        }
        sourceCanvas.width = canvasWidth;
        sourceCanvas.height = canvasHeight;
        outputCanvas.width = canvasWidth;
        outputCanvas.height = canvasHeight;
        sourceContext.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceContext.drawImage(image.element, ...calculateImageFit(fit, { width: image.width, height: image.height }, { width: canvasWidth, height: canvasHeight }));
        return runEffectChain({
          state: chainState.get(canvasWidth, canvasHeight),
          source: sourceCanvas,
          effects: memoizedEffects,
          output: outputCanvas,
          width: canvasWidth,
          height: canvasHeight
        });
      }).then((completed) => {
        if (completed && !cancelled) {
          continueRenderOnce();
        }
      }).catch((err) => {
        if (err.name === "AbortError") {
          continueRenderOnce();
          return;
        }
        errorCount++;
        if (errorCount <= maxRetries) {
          const backoff = exponentialBackoff2(errorCount);
          console.warn(`Could not load <CanvasImage> with src="${truncateSrcForLabel(actualSrc)}", retrying in ${backoff}ms`);
          timeoutId = setTimeout(() => {
            if (!cancelled) {
              attemptLoad();
            }
          }, backoff);
        } else if (onError) {
          onError(err);
          continueRenderOnce();
        } else {
          cancelRender2(err);
        }
      });
    };
    attemptLoad();
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      controller.abort();
      continueRenderOnce();
    };
  }, [
    actualSrc,
    cancelRender2,
    chainState,
    continueRender2,
    delayPlayback,
    delayRender2,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    fit,
    height,
    maxRetries,
    memoizedEffects,
    onError,
    outputCanvas,
    pauseWhenLoading,
    sequenceContext?.postmounting,
    sequenceContext?.premounting,
    sourceCanvas,
    width
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("canvas", {
    ref: canvasRef,
    width,
    height,
    className,
    style,
    id
  });
});
CanvasImageContent.displayName = "CanvasImageContent";
var CanvasImageInner = (0, import_react62.forwardRef)(({
  src,
  width,
  height,
  fit,
  effects = [],
  className,
  style,
  id,
  onError,
  pauseWhenLoading,
  maxRetries,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  durationInFrames,
  from,
  hidden,
  name,
  showInTimeline,
  stack,
  _experimentalControls: controls
}, ref) => {
  if (!src) {
    throw new Error('No "src" prop was passed to <CanvasImage>.');
  }
  const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(Sequence, {
    layout: "none",
    from: from ?? 0,
    durationInFrames: durationInFrames ?? Infinity,
    hidden,
    showInTimeline: showInTimeline ?? true,
    name: name ?? "<CanvasImage>",
    _experimentalControls: controls,
    _remotionInternalEffects: memoizedEffectDefinitions,
    _remotionInternalIsMedia: { type: "image", src },
    _remotionInternalStack: stack,
    children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(CanvasImageContent, {
      ref,
      src,
      width,
      height,
      fit,
      effects,
      controls,
      className,
      style,
      id,
      onError,
      pauseWhenLoading,
      maxRetries,
      delayRenderRetries,
      delayRenderTimeoutInMilliseconds
    })
  });
});
var CanvasImage = wrapInSchema(CanvasImageInner, canvasImageSchema);
CanvasImage.displayName = "CanvasImage";
addSequenceStackTraces(CanvasImage);
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 1e-3;
var SUBDIVISION_PRECISION = 1e-7;
var SUBDIVISION_MAX_ITERATIONS = 10;
var kSplineTableSize = 11;
var kSampleStepSize = 1 / (kSplineTableSize - 1);
var float32ArraySupported = typeof Float32Array === "function";
function a(aA1, aA2) {
  return 1 - 3 * aA2 + 3 * aA1;
}
function b(aA1, aA2) {
  return 3 * aA2 - 6 * aA1;
}
function c(aA1) {
  return 3 * aA1;
}
function calcBezier(aT, aA1, aA2) {
  return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
}
function getSlope(aT, aA1, aA2) {
  return 3 * a(aA1, aA2) * aT * aT + 2 * b(aA1, aA2) * aT + c(aA1);
}
function binarySubdivide({
  aX,
  _aA,
  _aB,
  mX1,
  mX2
}) {
  let currentX;
  let currentT;
  let i = 0;
  let aA = _aA;
  let aB = _aB;
  do {
    currentT = aA + (aB - aA) / 2;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}
function newtonRaphsonIterate(aX, _aGuessT, mX1, mX2) {
  let aGuessT = _aGuessT;
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}
function bezier(mX1, mY1, mX2, mY2) {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }
  const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }
  function getTForX(aX) {
    let intervalStart = 0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;
    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    }
    if (initialSlope === 0) {
      return guessForT;
    }
    return binarySubdivide({
      aX,
      _aA: intervalStart,
      _aB: intervalStart + kSampleStepSize,
      mX1,
      mX2
    });
  }
  return function(x) {
    const clampedX = Math.min(1, Math.max(0, x));
    if (mX1 === mY1 && mX2 === mY2) {
      return clampedX;
    }
    if (clampedX === 0) {
      return 0;
    }
    if (clampedX === 1) {
      return 1;
    }
    return calcBezier(getTForX(clampedX), mY1, mY2);
  };
}
var clampUnit = (t) => Math.min(1, Math.max(0, t));
var Easing = class _Easing {
  static step0(n) {
    return n > 0 ? 1 : 0;
  }
  static step1(n) {
    return n >= 1 ? 1 : 0;
  }
  static linear(t) {
    return t;
  }
  static ease(t) {
    return _Easing.bezier(0.42, 0, 1, 1)(t);
  }
  static quad(t) {
    return t * t;
  }
  static cubic(t) {
    return t * t * t;
  }
  static poly(n) {
    return (t) => t ** n;
  }
  static sin(t) {
    return 1 - Math.cos(t * Math.PI / 2);
  }
  static circle(t) {
    const u = clampUnit(t);
    return 1 - Math.sqrt(1 - u * u);
  }
  static exp(t) {
    return 2 ** (10 * (t - 1));
  }
  static elastic(bounciness = 1) {
    const p4 = bounciness * Math.PI;
    return (t) => 1 - Math.cos(t * Math.PI / 2) ** 3 * Math.cos(t * p4);
  }
  static back(s = 1.70158) {
    return (t) => t * t * ((s + 1) * t - s);
  }
  static bounce(t) {
    const u = clampUnit(t);
    if (u < 1 / 2.75) {
      return 7.5625 * u * u;
    }
    if (u < 2 / 2.75) {
      const t2_ = u - 1.5 / 2.75;
      return 7.5625 * t2_ * t2_ + 0.75;
    }
    if (u < 2.5 / 2.75) {
      const t2_ = u - 2.25 / 2.75;
      return 7.5625 * t2_ * t2_ + 0.9375;
    }
    const t2 = u - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
  static bezier(x1, y1, x2, y2) {
    return bezier(x1, y1, x2, y2);
  }
  static in(easing) {
    return easing;
  }
  static out(easing) {
    return (t) => 1 - easing(1 - t);
  }
  static inOut(easing) {
    return (t) => {
      if (t < 0.5) {
        return easing(t * 2) / 2;
      }
      return 1 - easing((1 - t) * 2) / 2;
    };
  }
};
var IFrameRefForwarding = ({
  onLoad,
  onError,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  ...props2
}, ref) => {
  const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
  const [handle] = (0, import_react64.useState)(() => delayRender2(`Loading <IFrame> with source ${props2.src}`, {
    retries: delayRenderRetries ?? void 0,
    timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
  }));
  const didLoad = (0, import_react64.useCallback)((e) => {
    continueRender2(handle);
    onLoad?.(e);
  }, [handle, onLoad, continueRender2]);
  const didGetError = (0, import_react64.useCallback)((e) => {
    continueRender2(handle);
    if (onError) {
      onError(e);
    } else {
      console.error("Error loading iframe:", e, "Handle the event using the onError() prop to make this message disappear.");
    }
  }, [handle, onError, continueRender2]);
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("iframe", {
    referrerPolicy: "strict-origin-when-cross-origin",
    ...props2,
    ref,
    onError: didGetError,
    onLoad: didLoad
  });
};
var IFrame = (0, import_react64.forwardRef)(IFrameRefForwarding);
var compositionsRef = import_react66.default.createRef();
var exports_default_css = {};
__export(exports_default_css, {
  makeDefaultPreviewCSS: () => makeDefaultPreviewCSS,
  injectCSS: () => injectCSS,
  OBJECTFIT_CONTAIN_CLASS_NAME: () => OBJECTFIT_CONTAIN_CLASS_NAME
});
var injected = {};
var injectCSS = (css) => {
  if (typeof document === "undefined") {
    return () => {
    };
  }
  if (injected[css]) {
    return () => {
    };
  }
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  head.prepend(style);
  injected[css] = style;
  return () => {
    const styleElement = injected[css];
    if (styleElement) {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      delete injected[css];
    }
  };
};
var OBJECTFIT_CONTAIN_CLASS_NAME = "__remotion_objectfitcontain";
var makeDefaultPreviewCSS = (scope, backgroundColor) => {
  if (!scope) {
    return `
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
	    background-color: ${backgroundColor};
    }
    .${OBJECTFIT_CONTAIN_CLASS_NAME} {
      object-fit: contain;
    }
    `;
  }
  return `
    ${scope} * {
      box-sizing: border-box;
    }
    ${scope} *:-webkit-full-screen {
      width: 100%;
      height: 100%;
    }
    ${scope} .${OBJECTFIT_CONTAIN_CLASS_NAME} {
      object-fit: contain;
    }
  `;
};
var MaxMediaCacheSizeContext = import_react68.default.createContext(null);
var MediaEnabledContext = (0, import_react70.createContext)(null);
var SequenceStackTracesUpdateContext = import_react71.default.createContext(() => {
});
var CurrentScaleContext = import_react72.default.createContext(null);
var PreviewSizeContext = (0, import_react72.createContext)({
  setSize: () => {
    return;
  },
  size: { size: "auto", translation: { x: 0, y: 0 } }
});
var getOffthreadVideoSource = ({
  src,
  transparent,
  currentTime,
  toneMapped
}) => {
  return `http://localhost:${window.remotion_proxyPort}/proxy?src=${encodeURIComponent(getAbsoluteSrc(src))}&time=${encodeURIComponent(Math.max(0, currentTime))}&transparent=${String(transparent)}&toneMapped=${String(toneMapped)}`;
};
var OffthreadVideoForRendering = ({
  onError,
  volume: volumeProp,
  playbackRate,
  src,
  muted,
  allowAmplificationDuringRender,
  transparent,
  toneMapped,
  toneFrequency,
  name,
  loopVolumeCurveBehavior,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  onVideoFrame,
  crossOrigin,
  audioStreamIndex,
  preservePitch: _preservePitch,
  ...props2
}) => {
  const absoluteFrame = useTimelinePosition();
  const frame = useCurrentFrame();
  const volumePropsFrame = useFrameForVolumeProp(loopVolumeCurveBehavior);
  const videoConfig = useUnsafeVideoConfig();
  const sequenceContext = (0, import_react74.useContext)(SequenceContext);
  const mediaStartsAt = useMediaStartsAt();
  const { registerRenderAsset, unregisterRenderAsset } = (0, import_react74.useContext)(RenderAssetManager);
  if (!src) {
    throw new TypeError("No `src` was passed to <OffthreadVideo>.");
  }
  const id = (0, import_react74.useMemo)(() => `offthreadvideo-${random(src)}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.relativeFrom}-${sequenceContext?.durationInFrames}`, [
    src,
    sequenceContext?.cumulatedFrom,
    sequenceContext?.relativeFrom,
    sequenceContext?.durationInFrames
  ]);
  if (!videoConfig) {
    throw new Error("No video config found");
  }
  const volume = evaluateVolume({
    volume: volumeProp,
    frame: volumePropsFrame,
    mediaVolume: 1
  });
  warnAboutTooHighVolume(volume);
  (0, import_react74.useEffect)(() => {
    if (!src) {
      throw new Error("No src passed");
    }
    if (!window.remotion_audioEnabled) {
      return;
    }
    if (muted) {
      return;
    }
    if (volume <= 0) {
      return;
    }
    registerRenderAsset({
      type: "video",
      src: getAbsoluteSrc(src),
      id,
      frame: absoluteFrame,
      volume,
      mediaFrame: frame,
      playbackRate,
      toneFrequency,
      audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
      audioStreamIndex
    });
    return () => unregisterRenderAsset(id);
  }, [
    muted,
    src,
    registerRenderAsset,
    id,
    unregisterRenderAsset,
    volume,
    frame,
    absoluteFrame,
    playbackRate,
    toneFrequency,
    sequenceContext?.cumulatedNegativeFrom,
    audioStreamIndex
  ]);
  const currentTime = (0, import_react74.useMemo)(() => {
    return getExpectedMediaFrameUncorrected({
      frame,
      playbackRate: playbackRate || 1,
      startFrom: -mediaStartsAt
    }) / videoConfig.fps;
  }, [frame, mediaStartsAt, playbackRate, videoConfig.fps]);
  const actualSrc = (0, import_react74.useMemo)(() => {
    return getOffthreadVideoSource({
      src,
      currentTime,
      transparent,
      toneMapped
    });
  }, [toneMapped, currentTime, src, transparent]);
  const [imageSrc, setImageSrc] = (0, import_react74.useState)(null);
  const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
  (0, import_react74.useLayoutEffect)(() => {
    if (!window.remotion_videoEnabled) {
      return;
    }
    const cleanup = [];
    setImageSrc(null);
    const controller = new AbortController();
    const newHandle = delayRender2(`Fetching ${actualSrc} from server`, {
      retries: delayRenderRetries ?? void 0,
      timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
    });
    const execute = async () => {
      try {
        const res = await fetch(actualSrc, {
          signal: controller.signal,
          cache: "no-store"
        });
        if (res.status !== 200) {
          if (res.status === 500) {
            const json = await res.json();
            if (json.error) {
              const cleanedUpErrorMessage = json.error.replace(/^Error: /, "");
              throw new Error(cleanedUpErrorMessage);
            }
          }
          throw new Error(`Server returned status ${res.status} while fetching ${actualSrc}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        cleanup.push(() => URL.revokeObjectURL(url));
        setImageSrc({
          src: url,
          handle: newHandle
        });
      } catch (err) {
        if (err.message.includes("aborted")) {
          continueRender2(newHandle);
          return;
        }
        if (controller.signal.aborted) {
          continueRender2(newHandle);
          return;
        }
        if (err.message.includes("Failed to fetch")) {
          err = new Error(`Failed to fetch ${actualSrc}. This could be caused by Chrome rejecting the request because the disk space is low. Consider increasing the disk size of your environment.`, { cause: err });
        }
        if (onError) {
          onError(err);
        } else {
          cancelRender(err);
        }
      }
    };
    execute();
    cleanup.push(() => {
      if (controller.signal.aborted) {
        return;
      }
      controller.abort();
    });
    return () => {
      cleanup.forEach((c2) => c2());
    };
  }, [
    actualSrc,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    onError,
    continueRender2,
    delayRender2
  ]);
  const onErr = (0, import_react74.useCallback)(() => {
    if (onError) {
      onError?.(new Error("Failed to load image with src " + imageSrc));
    } else {
      cancelRender("Failed to load image with src " + imageSrc);
    }
  }, [imageSrc, onError]);
  const className = (0, import_react74.useMemo)(() => {
    return [OBJECTFIT_CONTAIN_CLASS_NAME, props2.className].filter(truthy).join(" ");
  }, [props2.className]);
  const onImageFrame = (0, import_react74.useCallback)((img) => {
    if (onVideoFrame) {
      onVideoFrame(img);
    }
  }, [onVideoFrame]);
  if (!imageSrc || !window.remotion_videoEnabled) {
    return null;
  }
  continueRender2(imageSrc.handle);
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(Img, {
    src: imageSrc.src,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    onImageFrame,
    ...props2,
    onError: onErr,
    className
  });
};
var useEmitVideoFrame = ({
  ref,
  onVideoFrame
}) => {
  (0, import_react76.useEffect)(() => {
    const { current } = ref;
    if (!current) {
      return;
    }
    if (!onVideoFrame) {
      return;
    }
    let handle = 0;
    const callback = () => {
      if (!ref.current) {
        return;
      }
      onVideoFrame(ref.current);
      handle = ref.current.requestVideoFrameCallback(callback);
    };
    callback();
    return () => {
      current.cancelVideoFrameCallback(handle);
    };
  }, [onVideoFrame, ref]);
};
var MediaPlaybackError = class extends Error {
  src;
  constructor({ message, src }) {
    super(message);
    this.name = "MediaPlaybackError";
    this.src = src;
  }
};
var VideoForDevelopmentRefForwardingFunction = (props2, ref) => {
  const context = (0, import_react75.useContext)(SharedAudioContext);
  if (!context) {
    throw new Error("SharedAudioContext not found");
  }
  const videoRef = (0, import_react75.useRef)(null);
  const sharedSource = (0, import_react75.useMemo)(() => {
    if (!context.audioContext) {
      return null;
    }
    return makeSharedElementSourceNode({
      audioContext: context.audioContext,
      ref: videoRef
    });
  }, [context.audioContext]);
  const effectToUse = import_react75.default.useInsertionEffect ?? import_react75.default.useLayoutEffect;
  effectToUse(() => {
    return () => {
      requestAnimationFrame(() => {
        sharedSource?.cleanup();
      });
    };
  }, [sharedSource]);
  const {
    volume,
    muted,
    playbackRate,
    preservePitch,
    onlyWarnForMediaSeekingError,
    src,
    onDuration,
    acceptableTimeShift,
    acceptableTimeShiftInSeconds,
    toneFrequency,
    name,
    _remotionInternalNativeLoopPassed,
    _remotionInternalStack,
    style,
    pauseWhenBuffering,
    showInTimeline,
    loopVolumeCurveBehavior,
    onError,
    onAutoPlayError,
    onVideoFrame,
    crossOrigin,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    allowAmplificationDuringRender,
    useWebAudioApi,
    audioStreamIndex,
    ...nativeProps
  } = props2;
  const _propsValid = true;
  if (!_propsValid) {
    throw new Error("typecheck error");
  }
  const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
  const { fps, durationInFrames } = useVideoConfig();
  const parentSequence = (0, import_react75.useContext)(SequenceContext);
  const logLevel = useLogLevel();
  const mountTime = useMountTime();
  const [timelineId] = (0, import_react75.useState)(() => String(Math.random()));
  if (typeof acceptableTimeShift !== "undefined") {
    throw new Error("acceptableTimeShift has been removed. Use acceptableTimeShiftInSeconds instead.");
  }
  const [mediaVolume] = useMediaVolumeState();
  const [mediaMuted] = useMediaMutedState();
  const userPreferredVolume = evaluateVolume({
    frame: volumePropFrame,
    volume,
    mediaVolume
  });
  warnAboutTooHighVolume(userPreferredVolume);
  const getStack = (0, import_react75.useCallback)(() => {
    return _remotionInternalStack ?? null;
  }, [_remotionInternalStack]);
  useMediaInTimeline({
    volume,
    mediaVolume,
    mediaType: "video",
    src,
    playbackRate: props2.playbackRate ?? 1,
    displayName: name ?? null,
    id: timelineId,
    getStack,
    showInTimeline,
    premountDisplay: parentSequence?.premountDisplay ?? null,
    postmountDisplay: parentSequence?.postmountDisplay ?? null,
    loopDisplay: void 0,
    documentationLink: name === void 0 ? onlyWarnForMediaSeekingError ? "https://www.remotion.dev/docs/offthreadvideo" : "https://www.remotion.dev/docs/html5-video" : null
  });
  useMediaPlayback({
    mediaRef: videoRef,
    src,
    mediaType: "video",
    playbackRate: props2.playbackRate ?? 1,
    preservePitch,
    onlyWarnForMediaSeekingError,
    acceptableTimeshift: acceptableTimeShiftInSeconds ?? null,
    isPremounting: Boolean(parentSequence?.premounting),
    isPostmounting: Boolean(parentSequence?.postmounting),
    pauseWhenBuffering,
    onAutoPlayError: onAutoPlayError ?? null
  });
  useMediaTag({
    id: timelineId,
    isPostmounting: Boolean(parentSequence?.postmounting),
    isPremounting: Boolean(parentSequence?.premounting),
    mediaRef: videoRef,
    mediaType: "video",
    onAutoPlayError: onAutoPlayError ?? null
  });
  useVolume({
    logLevel,
    mediaRef: videoRef,
    volume: userPreferredVolume,
    source: sharedSource,
    shouldUseWebAudioApi: useWebAudioApi ?? false
  });
  const actualFrom = parentSequence ? parentSequence.relativeFrom : 0;
  const duration = parentSequence ? Math.min(parentSequence.durationInFrames, durationInFrames) : durationInFrames;
  const preloadedSrc = usePreload(src);
  const actualSrc = useAppendVideoFragment({
    actualSrc: preloadedSrc,
    actualFrom,
    duration,
    fps
  });
  (0, import_react75.useImperativeHandle)(ref, () => {
    return videoRef.current;
  }, []);
  (0, import_react75.useState)(() => playbackLogging({
    logLevel,
    message: `Mounting video with source = ${actualSrc}, v=${VERSION}, user agent=${typeof navigator === "undefined" ? "server" : navigator.userAgent}`,
    tag: "video",
    mountTime
  }));
  (0, import_react75.useEffect)(() => {
    const { current } = videoRef;
    if (!current) {
      return;
    }
    const errorHandler = () => {
      if (current.error) {
        console.error("Error occurred in video", current?.error);
        if (onError) {
          const err = new MediaPlaybackError({
            message: `Code ${current.error.code}: ${current.error.message}`,
            src
          });
          onError(err);
          return;
        }
        throw new MediaPlaybackError({
          message: `The browser threw an error while playing the video ${src}: Code ${current.error.code} - ${current?.error?.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`,
          src
        });
      } else {
        if (onError) {
          const err = new MediaPlaybackError({
            message: `The browser threw an error while playing the video ${src}`,
            src
          });
          onError(err);
          return;
        }
        throw new MediaPlaybackError({
          message: "The browser threw an error while playing the video",
          src
        });
      }
    };
    current.addEventListener("error", errorHandler, { once: true });
    return () => {
      current.removeEventListener("error", errorHandler);
    };
  }, [onError, src]);
  const currentOnDurationCallback = (0, import_react75.useRef)(onDuration);
  currentOnDurationCallback.current = onDuration;
  useEmitVideoFrame({ ref: videoRef, onVideoFrame });
  (0, import_react75.useEffect)(() => {
    const { current } = videoRef;
    if (!current) {
      return;
    }
    if (current.duration) {
      currentOnDurationCallback.current?.(src, current.duration);
      return;
    }
    const onLoadedMetadata = () => {
      currentOnDurationCallback.current?.(src, current.duration);
    };
    current.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      current.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [src]);
  (0, import_react75.useEffect)(() => {
    const { current } = videoRef;
    if (!current) {
      return;
    }
    if (isIosSafari()) {
      current.preload = "metadata";
    } else {
      current.preload = "auto";
    }
  }, []);
  const actualStyle = (0, import_react75.useMemo)(() => {
    return {
      ...style
    };
  }, [style]);
  const crossOriginValue = getCrossOriginValue({
    crossOrigin,
    requestsVideoFrame: Boolean(onVideoFrame),
    isClientSideRendering: false
  });
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("video", {
    ref: videoRef,
    muted: muted || mediaMuted || userPreferredVolume <= 0,
    playsInline: true,
    src: actualSrc,
    loop: _remotionInternalNativeLoopPassed,
    style: actualStyle,
    disableRemotePlayback: true,
    crossOrigin: crossOriginValue,
    ...nativeProps
  });
};
var VideoForPreview = (0, import_react75.forwardRef)(VideoForDevelopmentRefForwardingFunction);
var InnerOffthreadVideo = (props2) => {
  const {
    startFrom,
    endAt,
    trimBefore,
    trimAfter,
    name,
    pauseWhenBuffering,
    stack,
    showInTimeline,
    ...otherProps
  } = props2;
  const environment = useRemotionEnvironment();
  if (environment.isClientSideRendering) {
    throw new Error("<OffthreadVideo> is not supported in @remotion/web-renderer. Use <Video> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
  }
  const onDuration = (0, import_react73.useCallback)(() => {
    return;
  }, []);
  if (typeof props2.src !== "string") {
    throw new TypeError(`The \`<OffthreadVideo>\` tag requires a string for \`src\`, but got ${JSON.stringify(props2.src)} instead.`);
  }
  validateMediaTrimProps({ startFrom, endAt, trimBefore, trimAfter });
  const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
    startFrom,
    endAt,
    trimBefore,
    trimAfter
  });
  if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") {
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(Sequence, {
      layout: "none",
      from: 0 - (trimBeforeValue ?? 0),
      showInTimeline: false,
      durationInFrames: trimAfterValue,
      name,
      children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(InnerOffthreadVideo, {
        pauseWhenBuffering: pauseWhenBuffering ?? false,
        ...otherProps,
        trimAfter: void 0,
        name: void 0,
        showInTimeline,
        trimBefore: void 0,
        stack: void 0,
        startFrom: void 0,
        endAt: void 0
      })
    });
  }
  validateMediaProps(props2, "Video");
  if (environment.isRendering) {
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(OffthreadVideoForRendering, {
      pauseWhenBuffering: pauseWhenBuffering ?? false,
      ...otherProps,
      trimAfter: void 0,
      name: void 0,
      showInTimeline,
      trimBefore: void 0,
      stack: void 0,
      startFrom: void 0,
      endAt: void 0
    });
  }
  const {
    transparent,
    toneMapped,
    onAutoPlayError,
    onVideoFrame,
    crossOrigin,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    ...propsForPreview
  } = otherProps;
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(VideoForPreview, {
    _remotionInternalStack: stack ?? null,
    onDuration,
    onlyWarnForMediaSeekingError: true,
    pauseWhenBuffering: pauseWhenBuffering ?? false,
    showInTimeline: showInTimeline ?? true,
    onAutoPlayError: onAutoPlayError ?? void 0,
    onVideoFrame: onVideoFrame ?? null,
    crossOrigin,
    ...propsForPreview,
    _remotionInternalNativeLoopPassed: false
  });
};
var OffthreadVideo = ({
  src,
  acceptableTimeShiftInSeconds,
  allowAmplificationDuringRender,
  audioStreamIndex,
  className,
  crossOrigin,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  id,
  loopVolumeCurveBehavior,
  muted,
  name,
  onAutoPlayError,
  onError,
  onVideoFrame,
  pauseWhenBuffering,
  playbackRate,
  preservePitch,
  showInTimeline,
  style,
  toneFrequency,
  toneMapped,
  transparent,
  trimAfter,
  trimBefore,
  useWebAudioApi,
  volume,
  _remotionInternalNativeLoopPassed,
  endAt,
  stack,
  startFrom,
  imageFormat
}) => {
  if (imageFormat) {
    throw new TypeError(`The \`<OffthreadVideo>\` tag does no longer accept \`imageFormat\`. Use the \`transparent\` prop if you want to render a transparent video.`);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(InnerOffthreadVideo, {
    acceptableTimeShiftInSeconds,
    allowAmplificationDuringRender: allowAmplificationDuringRender ?? true,
    audioStreamIndex: audioStreamIndex ?? 0,
    className,
    crossOrigin,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    id,
    loopVolumeCurveBehavior: loopVolumeCurveBehavior ?? "repeat",
    muted: muted ?? false,
    name,
    onAutoPlayError: onAutoPlayError ?? null,
    onError,
    onVideoFrame,
    pauseWhenBuffering: pauseWhenBuffering ?? true,
    playbackRate: playbackRate ?? 1,
    preservePitch,
    toneFrequency: toneFrequency ?? 1,
    showInTimeline: showInTimeline ?? true,
    src,
    stack,
    startFrom,
    _remotionInternalNativeLoopPassed: _remotionInternalNativeLoopPassed ?? false,
    endAt,
    style,
    toneMapped: toneMapped ?? true,
    transparent: transparent ?? false,
    trimAfter,
    trimBefore,
    useWebAudioApi: useWebAudioApi ?? false,
    volume
  });
};
addSequenceStackTraces(OffthreadVideo);
var compositionSelectorRef = (0, import_react65.createRef)();
var NUMBER = "[-+]?\\d*\\.?\\d+";
var PERCENTAGE = NUMBER + "%";
var flattenChildren = (children) => {
  const childrenArray = import_react79.default.Children.toArray(children);
  return childrenArray.reduce((flatChildren, child) => {
    if (child.type === import_react79.default.Fragment) {
      return flatChildren.concat(flattenChildren(child.props.children));
    }
    flatChildren.push(child);
    return flatChildren;
  }, []);
};
var IsInsideSeriesContext = (0, import_react80.createContext)(false);
var IsInsideSeriesContainer = ({ children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(IsInsideSeriesContext.Provider, {
    value: true,
    children
  });
};
var IsNotInsideSeriesProvider = ({ children }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(IsInsideSeriesContext.Provider, {
    value: false,
    children
  });
};
var useRequireToBeInsideSeries = () => {
  const isInsideSeries = import_react80.default.useContext(IsInsideSeriesContext);
  if (!isInsideSeries) {
    throw new Error("This component must be inside a <Series /> component.");
  }
};
var SeriesSequenceRefForwardingFunction = ({ children }, _ref) => {
  useRequireToBeInsideSeries();
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(IsNotInsideSeriesProvider, {
    children
  });
};
var SeriesSequence = (0, import_react78.forwardRef)(SeriesSequenceRefForwardingFunction);
var SeriesInner = (props2) => {
  const childrenValue = (0, import_react78.useMemo)(() => {
    let startFrame = 0;
    const flattenedChildren = flattenChildren(props2.children);
    return import_react78.Children.map(flattenedChildren, (child, i) => {
      const castedChild = child;
      if (typeof castedChild === "string") {
        if (castedChild.trim() === "") {
          return null;
        }
        throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but you passed a string "${castedChild}"`);
      }
      if (castedChild.type !== SeriesSequence) {
        throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but got ${castedChild} instead`);
      }
      const debugInfo = `index = ${i}, duration = ${castedChild.props.durationInFrames}`;
      const durationInFramesProp = castedChild.props.durationInFrames;
      const {
        durationInFrames,
        children: _children,
        from,
        name,
        ...passedProps
      } = castedChild.props;
      if (i !== flattenedChildren.length - 1 || durationInFramesProp !== Infinity) {
        validateDurationInFrames(durationInFramesProp, {
          component: `of a <Series.Sequence /> component`,
          allowFloats: true
        });
      }
      const offset = castedChild.props.offset ?? 0;
      if (Number.isNaN(offset)) {
        throw new TypeError(`The "offset" property of a <Series.Sequence /> must not be NaN, but got NaN (${debugInfo}).`);
      }
      if (!Number.isFinite(offset)) {
        throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
      }
      if (offset % 1 !== 0) {
        throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
      }
      const currentStartFrame = startFrame + offset;
      startFrame += durationInFramesProp + offset;
      return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Sequence, {
        name: name || "<Series.Sequence>",
        _remotionInternalDocumentationLink: name ? void 0 : "https://www.remotion.dev/docs/series",
        from: currentStartFrame,
        durationInFrames: durationInFramesProp,
        ...passedProps,
        ref: castedChild.ref,
        children: child
      });
    });
  }, [props2.children]);
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(IsInsideSeriesContainer, {
    children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Sequence, {
      layout: "none",
      name: "<Series>",
      _remotionInternalDocumentationLink: "https://www.remotion.dev/docs/series",
      ...props2,
      children: childrenValue
    })
  });
};
var Series = Object.assign(wrapInSchema(SeriesInner, sequenceSchemaDefaultLayoutNone), {
  Sequence: SeriesSequence
});
addSequenceStackTraces(Series);
addSequenceStackTraces(SeriesSequence);
var problematicCharacters = {
  "%3A": ":",
  "%2F": "/",
  "%3F": "?",
  "%23": "#",
  "%5B": "[",
  "%5D": "]",
  "%40": "@",
  "%21": "!",
  "%24": "$",
  "%26": "&",
  "%27": "'",
  "%28": "(",
  "%29": ")",
  "%2A": "*",
  "%2B": "+",
  "%2C": ",",
  "%3B": ";"
};
var didWarn2 = {};
var warnOnce3 = (message) => {
  if (didWarn2[message]) {
    return;
  }
  console.warn(message);
  didWarn2[message] = true;
};
var includesHexOfUnsafeChar = (path) => {
  for (const key of Object.keys(problematicCharacters)) {
    if (path.includes(key)) {
      return { containsHex: true, hexCode: key };
    }
  }
  return { containsHex: false };
};
var trimLeadingSlash = (path) => {
  if (path.startsWith("/")) {
    return trimLeadingSlash(path.substring(1));
  }
  return path;
};
var inner = (path) => {
  if (typeof window !== "undefined" && window.remotion_staticBase) {
    if (path.startsWith(window.remotion_staticBase)) {
      throw new Error(`The value "${path}" is already prefixed with the static base ${window.remotion_staticBase}. You don't need to call staticFile() on it.`);
    }
    return `${window.remotion_staticBase}/${trimLeadingSlash(path)}`;
  }
  return `/${trimLeadingSlash(path)}`;
};
var encodeBySplitting = (path) => {
  const splitBySlash = path.split("/");
  const encodedArray = splitBySlash.map((element) => {
    return encodeURIComponent(element);
  });
  const merged = encodedArray.join("/");
  return merged;
};
var staticFile = (path) => {
  if (path === null) {
    throw new TypeError("null was passed to staticFile()");
  }
  if (typeof path === "undefined") {
    throw new TypeError("undefined was passed to staticFile()");
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    throw new TypeError(`staticFile() does not support remote URLs - got "${path}". Instead, pass the URL without wrapping it in staticFile(). See: https://remotion.dev/docs/staticfile-remote-urls`);
  }
  if (path.startsWith("..") || path.startsWith("./")) {
    throw new TypeError(`staticFile() does not support relative paths - got "${path}". Instead, pass the name of a file that is inside the public/ folder. See: https://remotion.dev/docs/staticfile-relative-paths`);
  }
  if (path.startsWith("/Users") || path.startsWith("/home") || path.startsWith("/tmp") || path.startsWith("/etc") || path.startsWith("/opt") || path.startsWith("/var") || path.startsWith("C:") || path.startsWith("D:") || path.startsWith("E:")) {
    throw new TypeError(`staticFile() does not support absolute paths - got "${path}". Instead, pass the name of a file that is inside the public/ folder. See: https://remotion.dev/docs/staticfile-relative-paths`);
  }
  if (path.startsWith("public/")) {
    throw new TypeError(`Do not include the public/ prefix when using staticFile() - got "${path}". See: https://remotion.dev/docs/staticfile-relative-paths`);
  }
  const includesHex = includesHexOfUnsafeChar(path);
  if (includesHex.containsHex) {
    warnOnce3(`WARNING: You seem to pass an already encoded path (path contains ${includesHex.hexCode}). Since Remotion 4.0, the encoding is done by staticFile() itself. You may want to remove a encodeURIComponent() wrapping.`);
  }
  const preprocessed = encodeBySplitting(path);
  const preparsed = inner(preprocessed);
  if (!preparsed.startsWith("/")) {
    return `/${preparsed}`;
  }
  return preparsed;
};
var roundTo6Commas = (num) => {
  return Math.round(num * 1e5) / 1e5;
};
var seekToTime = ({
  element,
  desiredTime,
  logLevel,
  mountTime
}) => {
  if (isApproximatelyTheSame(element.currentTime, desiredTime)) {
    return {
      wait: Promise.resolve(desiredTime),
      cancel: () => {
      }
    };
  }
  seek({
    logLevel,
    mediaRef: element,
    time: desiredTime,
    why: "Seeking during rendering",
    mountTime
  });
  let cancel;
  let cancelSeeked = null;
  const prom = new Promise((resolve) => {
    cancel = element.requestVideoFrameCallback((now, metadata) => {
      const displayIn = metadata.expectedDisplayTime - now;
      if (displayIn <= 0) {
        resolve(metadata.mediaTime);
        return;
      }
      setTimeout(() => {
        resolve(metadata.mediaTime);
      }, displayIn + 150);
    });
  });
  const waitForSeekedEvent = new Promise((resolve) => {
    const onDone = () => {
      resolve();
    };
    element.addEventListener("seeked", onDone, {
      once: true
    });
    cancelSeeked = () => {
      element.removeEventListener("seeked", onDone);
    };
  });
  return {
    wait: Promise.all([prom, waitForSeekedEvent]).then(([time]) => time),
    cancel: () => {
      cancelSeeked?.();
      element.cancelVideoFrameCallback(cancel);
    }
  };
};
var seekToTimeMultipleUntilRight = ({
  element,
  desiredTime,
  fps,
  logLevel,
  mountTime
}) => {
  const threshold = 1 / fps / 2;
  let currentCancel = () => {
    return;
  };
  if (Number.isFinite(element.duration) && element.currentTime >= element.duration && desiredTime >= element.duration) {
    return {
      prom: Promise.resolve(),
      cancel: () => {
      }
    };
  }
  const prom = new Promise((resolve, reject) => {
    const firstSeek = seekToTime({
      element,
      desiredTime: desiredTime + threshold,
      logLevel,
      mountTime
    });
    firstSeek.wait.then((seekedTo) => {
      const difference = Math.abs(desiredTime - seekedTo);
      if (difference <= threshold) {
        return resolve();
      }
      const sign = desiredTime > seekedTo ? 1 : -1;
      const newSeek = seekToTime({
        element,
        desiredTime: seekedTo + threshold * sign,
        logLevel,
        mountTime
      });
      currentCancel = newSeek.cancel;
      newSeek.wait.then((newTime) => {
        const newDifference = Math.abs(desiredTime - newTime);
        if (roundTo6Commas(newDifference) <= roundTo6Commas(threshold)) {
          return resolve();
        }
        const thirdSeek = seekToTime({
          element,
          desiredTime: desiredTime + threshold,
          logLevel,
          mountTime
        });
        currentCancel = thirdSeek.cancel;
        return thirdSeek.wait.then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        reject(err);
      });
    });
    currentCancel = firstSeek.cancel;
  });
  return {
    prom,
    cancel: () => {
      currentCancel();
    }
  };
};
var VideoForRenderingForwardFunction = ({
  onError,
  volume: volumeProp,
  allowAmplificationDuringRender,
  playbackRate,
  onDuration,
  toneFrequency,
  name,
  acceptableTimeShiftInSeconds,
  delayRenderRetries,
  delayRenderTimeoutInMilliseconds,
  loopVolumeCurveBehavior,
  audioStreamIndex,
  onVideoFrame,
  preservePitch: _preservePitch,
  ...props2
}, ref) => {
  const absoluteFrame = useTimelinePosition();
  const frame = useCurrentFrame();
  const volumePropsFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
  const videoConfig = useUnsafeVideoConfig();
  const videoRef = (0, import_react83.useRef)(null);
  const sequenceContext = (0, import_react83.useContext)(SequenceContext);
  const mediaStartsAt = useMediaStartsAt();
  const environment = useRemotionEnvironment();
  const logLevel = useLogLevel();
  const mountTime = useMountTime();
  const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
  const { registerRenderAsset, unregisterRenderAsset } = (0, import_react83.useContext)(RenderAssetManager);
  const id = (0, import_react83.useMemo)(() => `video-${random(props2.src ?? "")}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.relativeFrom}-${sequenceContext?.durationInFrames}`, [
    props2.src,
    sequenceContext?.cumulatedFrom,
    sequenceContext?.relativeFrom,
    sequenceContext?.durationInFrames
  ]);
  if (!videoConfig) {
    throw new Error("No video config found");
  }
  const volume = evaluateVolume({
    volume: volumeProp,
    frame: volumePropsFrame,
    mediaVolume: 1
  });
  warnAboutTooHighVolume(volume);
  (0, import_react83.useEffect)(() => {
    if (!props2.src) {
      throw new Error("No src passed");
    }
    if (props2.muted) {
      return;
    }
    if (volume <= 0) {
      return;
    }
    if (!window.remotion_audioEnabled) {
      return;
    }
    registerRenderAsset({
      type: "video",
      src: getAbsoluteSrc(props2.src),
      id,
      frame: absoluteFrame,
      volume,
      mediaFrame: frame,
      playbackRate: playbackRate ?? 1,
      toneFrequency: toneFrequency ?? 1,
      audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
      audioStreamIndex: audioStreamIndex ?? 0
    });
    return () => unregisterRenderAsset(id);
  }, [
    props2.muted,
    props2.src,
    registerRenderAsset,
    id,
    unregisterRenderAsset,
    volume,
    frame,
    absoluteFrame,
    playbackRate,
    toneFrequency,
    sequenceContext?.cumulatedNegativeFrom,
    audioStreamIndex
  ]);
  (0, import_react83.useImperativeHandle)(ref, () => {
    return videoRef.current;
  }, []);
  (0, import_react83.useEffect)(() => {
    if (!window.remotion_videoEnabled) {
      return;
    }
    const { current } = videoRef;
    if (!current) {
      return;
    }
    const currentTime = getMediaTime({
      frame,
      playbackRate: playbackRate || 1,
      startFrom: -mediaStartsAt,
      fps: videoConfig.fps
    });
    const handle = delayRender2(`Rendering <Html5Video /> with src="${props2.src}" at time ${currentTime}`, {
      retries: delayRenderRetries ?? void 0,
      timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
    });
    if (window.process?.env?.NODE_ENV === "test") {
      continueRender2(handle);
      return;
    }
    if (isApproximatelyTheSame(current.currentTime, currentTime)) {
      if (current.readyState >= 2) {
        continueRender2(handle);
        return;
      }
      const loadedDataHandler = () => {
        continueRender2(handle);
      };
      current.addEventListener("loadeddata", loadedDataHandler, { once: true });
      return () => {
        current.removeEventListener("loadeddata", loadedDataHandler);
      };
    }
    const endedHandler = () => {
      continueRender2(handle);
    };
    const seek2 = seekToTimeMultipleUntilRight({
      element: current,
      desiredTime: currentTime,
      fps: videoConfig.fps,
      logLevel,
      mountTime
    });
    seek2.prom.then(() => {
      continueRender2(handle);
    });
    current.addEventListener("ended", endedHandler, { once: true });
    const errorHandler = () => {
      if (current?.error) {
        console.error("Error occurred in video", current?.error);
        if (onError) {
          return;
        }
        throw new MediaPlaybackError({
          message: `The browser threw an error while playing the video ${props2.src}: Code ${current.error.code} - ${current?.error?.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`,
          src: props2.src
        });
      } else {
        throw new MediaPlaybackError({
          message: "The browser threw an error",
          src: props2.src
        });
      }
    };
    current.addEventListener("error", errorHandler, { once: true });
    return () => {
      seek2.cancel();
      current.removeEventListener("ended", endedHandler);
      current.removeEventListener("error", errorHandler);
      continueRender2(handle);
    };
  }, [
    volumePropsFrame,
    props2.src,
    playbackRate,
    videoConfig.fps,
    frame,
    mediaStartsAt,
    onError,
    delayRenderRetries,
    delayRenderTimeoutInMilliseconds,
    logLevel,
    mountTime,
    continueRender2,
    delayRender2
  ]);
  const { src } = props2;
  if (environment.isRendering) {
    (0, import_react83.useLayoutEffect)(() => {
      if (window.process?.env?.NODE_ENV === "test") {
        return;
      }
      const newHandle = delayRender2("Loading <Html5Video> duration with src=" + src, {
        retries: delayRenderRetries ?? void 0,
        timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
      });
      const { current } = videoRef;
      const didLoad = () => {
        if (current?.duration) {
          onDuration(src, current.duration);
        }
        continueRender2(newHandle);
      };
      if (current?.duration) {
        onDuration(src, current.duration);
        continueRender2(newHandle);
      } else {
        current?.addEventListener("loadedmetadata", didLoad, { once: true });
      }
      return () => {
        current?.removeEventListener("loadedmetadata", didLoad);
        continueRender2(newHandle);
      };
    }, [
      src,
      onDuration,
      delayRenderRetries,
      delayRenderTimeoutInMilliseconds,
      continueRender2,
      delayRender2
    ]);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("video", {
    ref: videoRef,
    disableRemotePlayback: true,
    ...props2
  });
};
var VideoForRendering = (0, import_react83.forwardRef)(VideoForRenderingForwardFunction);
var VideoForwardingFunction = (props2, ref) => {
  const {
    startFrom,
    endAt,
    trimBefore,
    trimAfter,
    name,
    pauseWhenBuffering,
    stack,
    _remotionInternalNativeLoopPassed,
    showInTimeline,
    onAutoPlayError,
    ...otherProps
  } = props2;
  const { loop, ...propsOtherThanLoop } = props2;
  const { fps } = useVideoConfig();
  const environment = useRemotionEnvironment();
  if (environment.isClientSideRendering) {
    throw new Error("<Html5Video> is not supported in @remotion/web-renderer. Use <Video> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
  }
  const { durations, setDurations } = (0, import_react82.useContext)(DurationsContext);
  if (typeof ref === "string") {
    throw new Error("string refs are not supported");
  }
  if (typeof props2.src !== "string") {
    throw new TypeError(`The \`<Html5Video>\` tag requires a string for \`src\`, but got ${JSON.stringify(props2.src)} instead.`);
  }
  const preloadedSrc = usePreload(props2.src);
  const onDuration = (0, import_react82.useCallback)((src, durationInSeconds) => {
    setDurations({ type: "got-duration", durationInSeconds, src });
  }, [setDurations]);
  const onVideoFrame = (0, import_react82.useCallback)(() => {
  }, []);
  const durationFetched = durations[getAbsoluteSrc(preloadedSrc)] ?? durations[getAbsoluteSrc(props2.src)];
  validateMediaTrimProps({ startFrom, endAt, trimBefore, trimAfter });
  const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
    startFrom,
    endAt,
    trimBefore,
    trimAfter
  });
  if (loop && durationFetched !== void 0) {
    if (!Number.isFinite(durationFetched)) {
      return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Html5Video, {
        ...propsOtherThanLoop,
        ref,
        stack,
        _remotionInternalNativeLoopPassed: true
      });
    }
    const mediaDuration = durationFetched * fps;
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Loop, {
      durationInFrames: calculateMediaDuration({
        trimAfter: trimAfterValue,
        mediaDurationInFrames: mediaDuration,
        playbackRate: props2.playbackRate ?? 1,
        trimBefore: trimBeforeValue
      }),
      layout: "none",
      name,
      showInTimeline: false,
      children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Html5Video, {
        ...propsOtherThanLoop,
        ref,
        stack,
        _remotionInternalNativeLoopPassed: true
      })
    });
  }
  if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") {
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Sequence, {
      layout: "none",
      from: 0 - (trimBeforeValue ?? 0),
      showInTimeline: false,
      durationInFrames: trimAfterValue === void 0 ? void 0 : trimAfterValue / (props2.playbackRate ?? 1),
      name,
      children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Html5Video, {
        pauseWhenBuffering: pauseWhenBuffering ?? false,
        ...otherProps,
        ref,
        stack
      })
    });
  }
  validateMediaProps({
    playbackRate: props2.playbackRate,
    preservePitch: props2.preservePitch,
    volume: props2.volume
  }, "Html5Video");
  if (environment.isRendering) {
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(VideoForRendering, {
      onDuration,
      onVideoFrame: onVideoFrame ?? null,
      ...otherProps,
      ref
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(VideoForPreview, {
    onlyWarnForMediaSeekingError: false,
    ...otherProps,
    ref,
    onVideoFrame: null,
    pauseWhenBuffering: pauseWhenBuffering ?? false,
    onDuration,
    _remotionInternalStack: stack ?? null,
    _remotionInternalNativeLoopPassed: _remotionInternalNativeLoopPassed ?? false,
    showInTimeline: showInTimeline ?? true,
    onAutoPlayError: onAutoPlayError ?? void 0
  });
};
var Html5Video = (0, import_react82.forwardRef)(VideoForwardingFunction);
addSequenceStackTraces(Html5Video);
checkMultipleRemotionVersions();
var proxyObj = {};
var Config = new Proxy(proxyObj, {
  get(_, prop) {
    if (prop === "Bundling" || prop === "Rendering" || prop === "Log" || prop === "Puppeteer" || prop === "Output") {
      return Config;
    }
    return () => {
      console.warn("\u26A0\uFE0F  The CLI configuration has been extracted from Remotion Core.");
      console.warn("Update the import from the config file:");
      console.warn();
      console.warn("- Delete:");
      console.warn('import {Config} from "remotion";');
      console.warn("+ Replace:");
      console.warn('import {Config} from "@remotion/cli/config";');
      console.warn();
      console.warn("For more information, see https://www.remotion.dev/docs/4-0-migration.");
      process.exit(1);
    };
  }
});
Sequence.displayName = "Sequence";
addSequenceStackTraces(Sequence);
addSequenceStackTraces(Composition);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react85 = __toESM(require_react());

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p22) => p22 ? p22.toUpperCase() : p1.toLowerCase()
);
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/Icon.js
var import_react84 = __toESM(require_react());

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/Icon.js
var Icon = (0, import_react84.forwardRef)(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => (0, import_react84.createElement)(
    "svg",
    {
      ref,
      ...defaultAttributes,
      width: size,
      height: size,
      stroke: color,
      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
      className: mergeClasses("lucide", className),
      ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
      ...rest
    },
    [
      ...iconNode.map(([tag, attrs]) => (0, import_react84.createElement)(tag, attrs)),
      ...Array.isArray(children) ? children : [children]
    ]
  )
);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component = (0, import_react85.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react85.createElement)(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/arrow-up-right.js
var __iconNode = [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
];
var ArrowUpRight = createLucideIcon("arrow-up-right", __iconNode);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/arrow-up.js
var __iconNode2 = [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
];
var ArrowUp = createLucideIcon("arrow-up", __iconNode2);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/chevron-down.js
var __iconNode3 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
var ChevronDown = createLucideIcon("chevron-down", __iconNode3);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/circle-alert.js
var __iconNode4 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
];
var CircleAlert = createLucideIcon("circle-alert", __iconNode4);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/circle-check.js
var __iconNode5 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
var CircleCheck = createLucideIcon("circle-check", __iconNode5);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/clock-3.js
var __iconNode6 = [
  ["path", { d: "M12 6v6h4", key: "135r8i" }],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
];
var Clock3 = createLucideIcon("clock-3", __iconNode6);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/landmark.js
var __iconNode7 = [
  ["path", { d: "M10 18v-7", key: "wt116b" }],
  [
    "path",
    {
      d: "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",
      key: "1m329m"
    }
  ],
  ["path", { d: "M14 18v-7", key: "vav6t3" }],
  ["path", { d: "M18 18v-7", key: "aexdmj" }],
  ["path", { d: "M3 22h18", key: "8prr45" }],
  ["path", { d: "M6 18v-7", key: "1ivflk" }]
];
var Landmark = createLucideIcon("landmark", __iconNode7);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/mic.js
var __iconNode8 = [
  ["path", { d: "M12 19v3", key: "npa21l" }],
  ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2", key: "1vc78b" }],
  ["rect", { x: "9", y: "2", width: "6", height: "13", rx: "3", key: "s6n7sd" }]
];
var Mic = createLucideIcon("mic", __iconNode8);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/plus.js
var __iconNode9 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
var Plus = createLucideIcon("plus", __iconNode9);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/receipt-text.js
var __iconNode10 = [
  [
    "path",
    { d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z", key: "q3az6g" }
  ],
  ["path", { d: "M14 8H8", key: "1l3xfs" }],
  ["path", { d: "M16 12H8", key: "1fr5h0" }],
  ["path", { d: "M13 16H8", key: "wsln4y" }]
];
var ReceiptText = createLucideIcon("receipt-text", __iconNode10);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/scale.js
var __iconNode11 = [
  ["path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "7g6ntu" }],
  ["path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "ijws7r" }],
  ["path", { d: "M7 21h10", key: "1b0cd5" }],
  ["path", { d: "M12 3v18", key: "108xh3" }],
  ["path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", key: "3gwbw2" }]
];
var Scale = createLucideIcon("scale", __iconNode11);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/trending-down.js
var __iconNode12 = [
  ["path", { d: "M16 17h6v-6", key: "t6n2it" }],
  ["path", { d: "m22 17-8.5-8.5-5 5L2 7", key: "x473p" }]
];
var TrendingDown = createLucideIcon("trending-down", __iconNode12);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/trending-up.js
var __iconNode13 = [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
];
var TrendingUp = createLucideIcon("trending-up", __iconNode13);

// node_modules/.pnpm/lucide-react@0.539.0_react@19.2.1/node_modules/lucide-react/dist/esm/icons/wallet-cards.js
var __iconNode14 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2", key: "4125el" }],
  [
    "path",
    {
      d: "M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21",
      key: "1dpki6"
    }
  ]
];
var WalletCards = createLucideIcon("wallet-cards", __iconNode14);

// src/components/icons/GoogleAdsIcon.tsx
var import_jsx_runtime39 = __toESM(require_jsx_runtime());
function GoogleAdsIcon({ className = "w-4 h-4", backgroundColor = "#ffffff" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
    "svg",
    {
      className,
      xmlns: "http://www.w3.org/2000/svg",
      xmlnsXlink: "http://www.w3.org/1999/xlink",
      id: "google-ads",
      width: "512",
      height: "512",
      enableBackground: "new 0 0 510 510",
      viewBox: "0 0 510 510",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("rect", { width: "510", height: "510", fill: "transparent", rx: "50" }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("linearGradient", { id: "SVGID_1_", x1: "-150.076", x2: "-11.6", y1: "211.162", y2: "287.973", gradientTransform: "matrix(-1 0 0 1 273.535 0)", gradientUnits: "userSpaceOnUse", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "0", stopColor: "#28a265" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "1", stopColor: "#28895e" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("linearGradient", { id: "lg1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "0", stopColor: "#108372", stopOpacity: "0" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "1", stopColor: "#006837" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("linearGradient", { xlinkHref: "#lg1", id: "SVGID_2_", x1: "337.313", x2: "266.231", y1: "213.47", y2: "170.612", gradientUnits: "userSpaceOnUse" }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("linearGradient", { id: "SVGID_3_", x1: "87.128", x2: "225.617", y1: "209.796", y2: "286.614", gradientUnits: "userSpaceOnUse", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "0", stopColor: "#7faef4" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "1", stopColor: "#4c8df1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("linearGradient", { id: "SVGID_4_", x1: "99.999", x2: "99.999", y1: "432.061", y2: "503.306", gradientUnits: "userSpaceOnUse", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "0", stopColor: "#4256ac", stopOpacity: "0" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("stop", { offset: "1", stopColor: "#1b1464" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("linearGradient", { xlinkHref: "#lg1", id: "SVGID_5_", x1: "410.001", x2: "410.001", y1: "419.506", y2: "454.067", gradientUnits: "userSpaceOnUse" }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("path", { fill: "url(#SVGID_1_)", d: "m189.015 81.215 60.687 146.186 5.306 12.786 73.655 178.182c13.617 32.943 40.38 53.555 69.535 53.555h98.73c9.837 0 16.14-13.375 11.539-24.486l-160.415-387.358c-5.625-13.539-16.637-21.003-28.632-21.003h-130.029c-11.258 0-7.991 23.818-.376 42.138z" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("path", { fill: "url(#SVGID_2_)", d: "m249.702 227.401 5.306 12.786.01.025 231.712 231.712h10.198c9.837 0 16.14-13.375 11.539-24.486l-160.415-387.358c-5.625-13.539-16.637-21.003-28.632-21.003h-130.029c-11.258 0-7.991 23.818-.377 42.138z" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("path", { fill: "url(#SVGID_3_)", d: "m356.774 81.142c-7.647-18.278-28.174-18.247-35.788.073l-60.687 146.186-5.306 12.786-73.655 178.182c-13.617 32.943-40.38 53.555-69.535 53.555h-98.73c-9.837 0-16.14-13.375-11.539-24.486l160.414-387.358c5.625-13.539 16.637-22.003 28.632-22.003h130.028c11.258 0 21.591 7.941 26.864 20.654l.557 1.35z" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("path", { fill: "url(#SVGID_4_)", d: "m32.267 373.226-30.733 74.211c-4.601 11.111 1.702 24.486 11.539 24.486h98.73c29.155 0 55.917-20.612 69.535-53.555l18.661-45.143h-167.732z" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("path", { fill: "url(#SVGID_5_)", d: "m328.662 418.368c13.618 32.943 40.38 53.555 69.535 53.555h98.73c9.837 0 16.14-13.375 11.539-24.486l-30.733-74.211h-167.731z" })
        ] })
      ]
    }
  );
}

// src/components/icons/MetaIcon.tsx
var import_jsx_runtime40 = __toESM(require_jsx_runtime());
function MetaIcon({ className = "w-4 h-4", backgroundColor = "#ffffff" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(
    "svg",
    {
      className,
      xmlns: "http://www.w3.org/2000/svg",
      width: "2500",
      height: "2500",
      viewBox: "0 0 266.893 266.895",
      id: "facebook",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("path", { fill: "#485a96", d: "M252.164 266.895c8.134 0 14.729-6.596 14.729-14.73V14.73c0-8.137-6.596-14.73-14.729-14.73H14.73C6.593 0 0 6.594 0 14.73v237.434c0 8.135 6.593 14.73 14.73 14.73h237.434z" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("path", { fill: "#fff", d: "M184.152 266.895V163.539h34.692l5.194-40.28h-39.887V97.542c0-11.662 3.238-19.609 19.962-19.609l21.329-.01V41.897c-3.689-.49-16.351-1.587-31.08-1.587-30.753 0-51.807 18.771-51.807 53.244v29.705h-34.781v40.28h34.781v103.355h41.597z" })
      ]
    }
  );
}

// src/components/icons/ShopifyIcon.tsx
var import_jsx_runtime41 = __toESM(require_jsx_runtime());
function ShopifyIcon({ className = "w-4 h-4", backgroundColor = "#ffffff" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(
    "svg",
    {
      className,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      id: "shopify",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("rect", { width: "24", height: "24", fill: "transparent", rx: "4" }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("path", { fill: "#95BF46", d: "M19.932 4.673a.233.233 0 0 0-.21-.195l-1.932-.144-1.422-1.413c-.141-.141-.415-.098-.522-.067l-.717.221C14.701 1.844 13.946.712 12.617.712c-.037 0-.074.001-.112.004C12.128.217 11.66 0 11.255 0 8.16 0 6.681 3.869 6.218 5.836c-1.203.372-2.057.637-2.166.672-.672.21-.693.231-.781.864-.067.479-1.823 14.063-1.823 14.063L15.136 24l7.417-1.604-2.621-17.723zM14.373 3.31l-1.158.358.001-.25c0-.765-.106-1.382-.277-1.87.685.087 1.141.866 1.434 1.762zM12.09 1.701c.19.477.314 1.161.314 2.085l-.001.134-2.392.741c.461-1.778 1.324-2.636 2.079-2.96zM11.17.83c.134 0 .268.045.397.134-.992.467-2.055 1.642-2.504 3.99l-1.891.586C7.698 3.749 8.947.83 11.17.83z" }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("path", { fill: "#5E8E3E", d: "m19.723 4.478-1.932-.144-1.422-1.413a.36.36 0 0 0-.198-.091L15.136 24l7.416-1.604s-2.604-17.602-2.62-17.723a.232.232 0 0 0-.209-.195z" }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("path", { fill: "#FFF", d: "m12.618 8.576-.914 2.72s-.801-.428-1.783-.428c-1.44 0-1.512.904-1.512 1.131 0 1.243 2.708 1.683 2.708 4.535 0 2.246-1.422 3.69-3.338 3.69-2.295 0-3.457-1.422-3.457-1.422l.628-2.07s1.204 1.018 2.172 1.018c.628 0 .872-.496.872-.854 0-1.49-2.225-1.557-2.225-4.264 0-2.19 1.557-4.306 4.713-4.306 1.22 0 1.827.349 1.827.349l-.691 2.641z" })
      ]
    }
  );
}

// src/assets/remotion/fonts/sfPro.ts
var IOS_REMOTION_FONT_STACK = '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
var SF_PRO_FONTS = [
  { family: "SF Pro Text", file: "SF-Pro-Text-Regular.otf", weight: 400 },
  { family: "SF Pro Text", file: "SF-Pro-Text-Medium.otf", weight: 500 },
  { family: "SF Pro Text", file: "SF-Pro-Text-Semibold.otf", weight: 600 },
  { family: "SF Pro Text", file: "SF-Pro-Text-Bold.otf", weight: 700 },
  { family: "SF Pro Display", file: "SF-Pro-Display-Regular.otf", weight: 400 },
  { family: "SF Pro Display", file: "SF-Pro-Display-Semibold.otf", weight: 600 },
  { family: "SF Pro Display", file: "SF-Pro-Display-Bold.otf", weight: 700 },
  { family: "SF Pro Display", file: "SF-Pro-Display-Heavy.otf", weight: 800 }
];
var fontLoadPromise = null;
function withFontTimeout(promise, timeoutMs = 3500) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    })
  ]);
}
function loadSfProFonts() {
  if (fontLoadPromise || typeof document === "undefined" || typeof FontFace === "undefined") {
    return fontLoadPromise;
  }
  fontLoadPromise = Promise.all(
    SF_PRO_FONTS.map(async (definition) => {
      const font = new FontFace(
        definition.family,
        `url("${staticFile(`remotion/fonts/sf-pro/${definition.file}`)}") format("opentype")`,
        {
          style: definition.style || "normal",
          weight: String(definition.weight)
        }
      );
      document.fonts.add(font);
      await withFontTimeout(font.load());
    })
  ).then(() => void 0).catch(() => void 0);
  return fontLoadPromise;
}

// src/assets/remotion/compositions/ChatGptMobileBase.tsx
var import_jsx_runtime42 = __toESM(require_jsx_runtime());
loadSfProFonts();

// src/assets/remotion/compositions/ClaudeMobileBase.tsx
var import_jsx_runtime43 = __toESM(require_jsx_runtime());
loadSfProFonts();

// src/assets/remotion/compositions/ChatGptClaudeOttoAiEmployeesVideo.tsx
var import_jsx_runtime44 = __toESM(require_jsx_runtime());
loadSfProFonts();
function p(frame, from, to, out = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
function Spinner({ active }) {
  const frame = useCurrentFrame();
  if (!active) {
    return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: "#12b76a", borderRadius: 999, display: "block", height: 11, width: 11 } });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(
    "span",
    {
      style: {
        border: "3px solid #d7d7d7",
        borderRadius: 999,
        borderRightColor: "#111111",
        display: "block",
        height: 24,
        transform: `rotate(${frame * 20}deg)`,
        width: 24
      }
    }
  );
}
function CascadeResultCard({ localFrame, result }) {
  const show = p(localFrame, 0, 18);
  const rows = result.rows ?? [];
  const rowHeight = 72;
  const cardHeight = result.kind === "dashboard" || result.kind === "dashboardOutline" || result.kind === "reportOutline" || result.kind === "slides" ? 552 : result.kind === "employee" || result.kind === "cashflow" || result.kind === "insights" ? 500 : interpolate(p(localFrame, 34, 78), [0, 1], [116, 126 + rows.length * rowHeight], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress3 = Math.round(interpolate(p(localFrame, 18, 154), [0, 1], [18, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 30, boxShadow: "0 18px 46px rgba(15, 23, 42, 0.08)", height: cardHeight, overflow: "hidden", padding: "16px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", display: "flex", justifyContent: "space-between", padding: "0 28px 12px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 5 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("strong", { style: { color: "#111111", fontSize: 23, fontWeight: 650, letterSpacing: -0.12 }, children: result.title }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#8b8b8b", fontSize: 17, fontWeight: 420 }, children: result.subtitle })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("span", { style: { background: "#ecfdf3", border: "1px solid #bbf7d0", borderRadius: 999, color: "#0f8f51", fontSize: 18, fontWeight: 650, padding: "9px 14px" }, children: [
        progress3,
        "%"
      ] })
    ] }),
    result.kind === "dashboard" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(DashboardResult, { localFrame: localFrame - 20 }) : result.kind === "dashboardOutline" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(DashboardOutlineResult, { localFrame: localFrame - 20, subtitle: result.subtitle, title: result.title }) : result.kind === "reportOutline" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(ReportOutlineResult, { localFrame: localFrame - 20 }) : result.kind === "slides" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SlidesResult, { localFrame: localFrame - 20 }) : result.kind === "invoiceOutline" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(InvoiceOutlineResult, { localFrame: localFrame - 20 }) : result.kind === "employee" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(EmployeeResult, { localFrame: localFrame - 20 }) : result.kind === "cashflow" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(CashFlowAnalysisResult, { localFrame: localFrame - 20 }) : result.kind === "insights" ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(SpendEconomyInsightResult, { localFrame: localFrame - 20 }) : result.kind === "reconciliation" ? rows.map((row3, index) => /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(ReconciliationResultRow, { index, localFrame, row: row3 }, `${row3.name}-${index}`)) : rows.map((row3, index) => /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(ResultRowItem, { index, localFrame, row: row3 }, `${row3.name}-${index}`))
  ] }) });
}
function OttoAiEmployeesSyncCard({
  frame,
  kind = "list",
  rows,
  subtitle,
  title
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(CascadeResultCard, { localFrame: frame, result: { kind, rows, subtitle, title } });
}
function BrandIconBox({ row: row3 }) {
  const Icon2 = row3.icon;
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "center", background: "#ffffff", border: "1px solid #e7edf0", borderRadius: 12, boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)", color: row3.tone, display: "flex", height: 42, justifyContent: "center", overflow: "hidden", width: 42 }, children: Icon2 ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(Icon2, { className: "h-7 w-7" }) : /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { alignItems: "center", background: row3.tone, borderRadius: 9, color: "#ffffff", display: "flex", fontSize: 14, fontWeight: 780, height: 31, justifyContent: "center", letterSpacing: -0.2, width: 31 }, children: row3.initials }) });
}
function ResultRowItem({ index, localFrame, row: row3 }) {
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10);
  const complete = localFrame >= 62 + index * 10;
  const alert = row3.status.includes("Revisar") || row3.status.includes("Atraso") || row3.status.includes("Risco") || row3.status.includes("Pendente") || row3.status.includes("Divergencia");
  const statusBackground = row3.background ?? (alert ? "#fff7ed" : "#ecfdf3");
  const statusColor = row3.background ? row3.tone : alert ? "#c2410c" : "#166534";
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", display: "grid", gap: 13, gridTemplateColumns: "42px 1fr auto auto 28px", height: 72, opacity: rowIn, padding: "0 22px", transform: `translateY(${(1 - rowIn) * 18}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(BrandIconBox, { row: row3 }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 5, minWidth: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("strong", { style: { color: "#111111", fontSize: 21, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: row3.name }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#8a8a8a", fontSize: 15, fontWeight: 420, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: row3.description })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 18, fontWeight: 540, whiteSpace: "nowrap" }, children: row3.value }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: statusBackground, borderRadius: 999, color: statusColor, fontSize: 16, fontWeight: 760, padding: "8px 11px", whiteSpace: "nowrap" }, children: complete ? row3.status : "Sincronizando" }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(Spinner, { active: !complete })
  ] });
}
function ReconciliationResultRow({ index, localFrame, row: row3 }) {
  const rowIn = p(localFrame, 10 + index * 10, 24 + index * 10);
  const complete = localFrame >= 76 + index * 10;
  const review = complete && (row3.status === "Revisar" || row3.status === "Divergencia");
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: "42px 1fr 38px 0.78fr auto 28px", height: 72, opacity: rowIn, padding: "0 22px", transform: `translateY(${(1 - rowIn) * 18}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(BrandIconBox, { row: row3 }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 5, minWidth: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("strong", { style: { color: "#111111", fontSize: 20, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: row3.name }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("span", { style: { color: "#8a8a8a", fontSize: 15, fontWeight: 420, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
        row3.description,
        " \xB7 ",
        row3.value
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { alignItems: "center", background: complete ? review ? "#fff7ed" : "#ecfdf3" : "#f2f4f7", borderRadius: 999, color: complete ? review ? "#c2410c" : "#166534" : "#667085", display: "flex", fontSize: 20, fontWeight: 850, height: 38, justifyContent: "center", width: 38 }, children: complete ? review ? "!" : "\u2713" : "\xB7" }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 20, fontWeight: 520, letterSpacing: -0.1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: row3.erp }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: review ? "#c2410c" : complete ? "#166534" : "#111111", fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }, children: complete ? row3.status : "Verificando" }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(Spinner, { active: !complete })
  ] });
}
function DashboardOutlineResult({ localFrame, subtitle, title }) {
  const outlineIn = p(localFrame, 6, 24);
  const click = p(localFrame, 104, 122);
  const cursorX = interpolate(p(localFrame, 74, 112), [0, 1], [360, 478], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(p(localFrame, 74, 112), [0, 1], [98, 134], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { height: 420, overflow: "hidden", padding: "4px 22px 0", position: "relative" }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { opacity: outlineIn, transform: `translateY(${(1 - outlineIn) * 14}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background: "#ffffff", border: "1px solid #e3e5e8", borderRadius: 20, boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)", display: "grid", gap: 18, gridTemplateColumns: "74px 1fr", padding: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "center", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 18, display: "flex", height: 74, justifyContent: "center", transform: "rotate(-4deg)", width: 74 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 28, fontWeight: 760 }, children: "\u25A6" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#737373", fontSize: 18, fontWeight: 430, marginTop: 6 }, children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { filter: "drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))", left: cursorX, position: "absolute", top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("svg", { height: "42", viewBox: "0 0 42 42", width: "42", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M8 5L32 24L21 26L16 37L8 5Z", fill: "#111111" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M18 25L23 36", stroke: "#ffffff", strokeLinecap: "round", strokeWidth: "3" })
    ] }) })
  ] }) });
}
function ReportOutlineResult({ localFrame }) {
  const outlineIn = p(localFrame, 6, 24);
  const click = p(localFrame, 104, 122);
  const reportIn = p(localFrame, 144, 174);
  const cursorX = interpolate(p(localFrame, 74, 112), [0, 1], [350, 474], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(p(localFrame, 74, 112), [0, 1], [96, 132], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { height: 420, overflow: "hidden", padding: "4px 22px 0", position: "relative" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { opacity: outlineIn * p(localFrame, 126, 150, [1, 0]), transform: `translateY(${(1 - outlineIn) * 14}px)` }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background: "#ffffff", border: "1px solid #e3e5e8", borderRadius: 20, boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)", display: "grid", gap: 18, gridTemplateColumns: "74px 1fr", padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "center", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 18, display: "flex", height: 74, justifyContent: "center", transform: "rotate(-4deg)", width: 74 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 25, fontWeight: 760 }, children: "PDF" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: "relatorio_resultados_empresa" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#737373", fontSize: 18, fontWeight: 430, marginTop: 6 }, children: "Relat\xF3rio \xB7 PDF" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { filter: "drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))", left: cursorX, position: "absolute", top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("svg", { height: "42", viewBox: "0 0 42 42", width: "42", children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M8 5L32 24L21 26L16 37L8 5Z", fill: "#111111" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M18 25L23 36", stroke: "#ffffff", strokeLinecap: "round", strokeWidth: "3" })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { opacity: reportIn, position: "absolute", transform: `translateY(${(1 - reportIn) * 18}px) scale(${0.985 + reportIn * 0.015})`, width: "calc(100% - 44px)" }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 24, boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)", padding: 22 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 25, fontWeight: 820 }, children: "Relat\xF3rio gerencial" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#737373", fontSize: 16, fontWeight: 430, marginTop: 5 }, children: "Resultados, caixa, margem e riscos" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { display: "grid", gap: 10, marginTop: 18 }, children: [
        ["Resumo executivo", "Caixa saud\xE1vel com aten\xE7\xE3o em atrasos"],
        ["Vencimentos", "R$ 63.980 em pagamentos pr\xF3ximos"],
        ["Recebimentos", "R$ 192.500 previstos e R$ 28.900 em atraso"],
        ["Economia", "Frete e m\xEDdia com potencial de redu\xE7\xE3o"]
      ].map(([label2, value], index) => {
        const itemIn = p(localFrame, 172 + index * 8, 190 + index * 8);
        return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr auto", opacity: itemIn, padding: "13px 15px", transform: `translateY(${(1 - itemIn) * 10}px)` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 17, fontWeight: 700 }, children: label2 }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#667085", fontSize: 15, fontWeight: 520 }, children: value })
        ] }, label2);
      }) })
    ] }) })
  ] });
}
function InvoiceOutlineResult({ localFrame }) {
  const outlineIn = p(localFrame, 6, 24);
  const click = p(localFrame, 166, 184);
  const cursorX = interpolate(p(localFrame, 136, 174), [0, 1], [350, 474], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(p(localFrame, 136, 174), [0, 1], [96, 132], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const steps = [
    ["Validando tomador", "CNPJ e inscri\xE7\xE3o municipal"],
    ["Calculando ISS", "Reten\xE7\xF5es e c\xF3digo de servi\xE7o"],
    ["Transmitindo NFS-e", "Prefeitura municipal"],
    ["Autorizada", "PDF e XML dispon\xEDveis"]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { height: 420, overflow: "hidden", padding: "4px 22px 0", position: "relative" }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { opacity: outlineIn, transform: `translateY(${(1 - outlineIn) * 14}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background: "#ffffff", border: "1px solid #e3e5e8", borderRadius: 20, boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)", display: "grid", gap: 18, gridTemplateColumns: "74px 1fr", padding: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "center", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 18, display: "flex", height: 74, justifyContent: "center", transform: "rotate(-4deg)", width: 74 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 28, fontWeight: 760 }, children: "NF" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: "nota_fiscal_servico_2048" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#737373", fontSize: 18, fontWeight: 430, marginTop: 6 }, children: "Nota fiscal \xB7 NFS-e" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)", display: "grid", gap: 8, marginTop: 14, padding: 14 }, children: steps.map(([label2, detail], index) => {
      const itemIn = p(localFrame, 34 + index * 24, 50 + index * 24);
      const complete = localFrame >= 66 + index * 24;
      const active = itemIn > 0 && !complete;
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", display: "grid", gap: 11, gridTemplateColumns: "28px 1fr auto", opacity: itemIn, padding: "5px 2px", transform: `translateY(${(1 - itemIn) * 8}px)` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { alignItems: "center", background: complete ? "#dcfce7" : active ? "#eef6ff" : "#f2f4f7", borderRadius: 999, color: complete ? "#166534" : "#2563eb", display: "flex", fontSize: 14, fontWeight: 820, height: 28, justifyContent: "center", width: 28 }, children: complete ? "\u2713" : "\xB7" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111111", fontSize: 16, fontWeight: 700, lineHeight: 1 }, children: label2 }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#8a8a8a", fontSize: 13, fontWeight: 430, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: detail })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: complete ? "#166534" : "#667085", fontSize: 13, fontWeight: 720 }, children: complete ? "OK" : active ? "Processando" : "Aguardando" })
      ] }, label2);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { filter: "drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))", left: cursorX, position: "absolute", top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("svg", { height: "42", viewBox: "0 0 42 42", width: "42", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M8 5L32 24L21 26L16 37L8 5Z", fill: "#111111" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("path", { d: "M18 25L23 36", stroke: "#ffffff", strokeLinecap: "round", strokeWidth: "3" })
    ] }) })
  ] }) });
}
function SlidesResult({ localFrame }) {
  const deckIn = p(localFrame, 8, 28);
  const active = Math.min(2, Math.floor(Math.max(0, localFrame - 54) / 42));
  const slideProgress = p(localFrame, 46, 150);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 14, gridTemplateColumns: "92px 1fr", opacity: deckIn, padding: "4px 22px 0", transform: `translateY(${(1 - deckIn) * 16}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { display: "grid", gap: 10 }, children: [0, 1, 2].map((item) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: item === active ? "#eef6ff" : "#f8fafc", border: `1px solid ${item === active ? "#93c5fd" : "#e5e7eb"}`, borderRadius: 12, height: 80, padding: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { background: item === active ? "#2563eb" : "#dbe5ee", borderRadius: 6, height: 10, width: "76%" } }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { background: "#ffffff", borderRadius: 5, height: 34, marginTop: 9 } })
    ] }, item)) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 22, boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)", minHeight: 400, overflow: "hidden", padding: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#667085", fontSize: 15, fontWeight: 760, textTransform: "uppercase" }, children: "Apresenta\xE7\xE3o executiva" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#111827", fontSize: 31, fontWeight: 860, letterSpacing: -0.3, lineHeight: 1.05, marginTop: 10 }, children: active === 0 ? "Resultados financeiros do m\xEAs" : active === 1 ? "Riscos, atrasos e economia" : "Pr\xF3ximas decis\xF5es recomendadas" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 22 }, children: [
        ["Caixa", "R$ 418k"],
        ["Receber", "R$ 192k"],
        ["Atrasos", "R$ 28.9k"],
        ["Economia", "+R$ 38k"]
      ].map(([label2, value], index) => {
        const itemIn = p(localFrame, 36 + index * 7, 54 + index * 7);
        return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 16, opacity: itemIn, padding: 15, transform: `translateY(${(1 - itemIn) * 10}px)` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#667085", fontSize: 13, fontWeight: 700 }, children: label2 }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: index === 2 ? "#dc2626" : "#16a34a", fontSize: 23, fontWeight: 840, marginTop: 6 }, children: value })
        ] }, label2);
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "end", background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 18, display: "grid", gap: 8, gridTemplateColumns: "repeat(6,1fr)", height: 110, marginTop: 18, padding: "18px 18px" }, children: [46, 72, 58, 92, 78, 104].map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: index > 3 ? "#16a34a" : "#dbe5ee", borderRadius: "8px 8px 4px 4px", display: "block", height: height * slideProgress, minHeight: 6 } }, height)) })
    ] })
  ] });
}
function DashboardResult({ localFrame }) {
  const kpis2 = [
    ["Caixa", "R$ 418k", "#16a34a"],
    ["Margem", "31,2%", "#2563eb"],
    ["Lucro", "+R$ 74k", "#7c3aed"]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 14, padding: "4px 22px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { display: "grid", gap: 10, gridTemplateColumns: "repeat(3, 1fr)" }, children: kpis2.map(([label2, value, color], index) => {
      const itemIn = p(localFrame, index * 8, 18 + index * 8);
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 18, opacity: itemIn, padding: 16, transform: `translateY(${(1 - itemIn) * 12}px)` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#667085", fontSize: 15, fontWeight: 650 }, children: label2 }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color, fontSize: 25, fontWeight: 840, marginTop: 6 }, children: value })
      ] }, label2);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "end", background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 22, display: "grid", gap: 10, gridTemplateColumns: "repeat(7,1fr)", height: 170, padding: "26px 24px" }, children: [72, 108, 84, 142, 118, 166, 136].map((height, index) => {
      const bar = p(localFrame, 34 + index * 6, 54 + index * 6);
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: index > 4 ? "#16a34a" : "#dbe5ee", borderRadius: "10px 10px 4px 4px", display: "block", height: height * bar, minHeight: 8 } }, height);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(InsightBlock, { localFrame: localFrame - 84, text: "Decisao sugerida: reduzir CAC em Meta Ads e renegociar fornecedor Cloud para proteger margem e caixa.", value: "+R$ 38k impacto estimado" })
  ] });
}
function CashFlowAnalysisResult({ localFrame }) {
  const kpis2 = [
    ["Caixa projetado", "R$ 418k", "+12 dias", "#16a34a"],
    ["Saidas 7 dias", "R$ 84k", "5 vencimentos", "#f97316"],
    ["Entradas 7 dias", "R$ 126k", "8 recebimentos", "#2563eb"],
    ["Risco de atraso", "R$ 14,8k", "2 clientes", "#dc2626"]
  ];
  const bars = [68, 92, 74, 116, 88, 138, 112, 156];
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 14, padding: "4px 22px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { display: "grid", gap: 10, gridTemplateColumns: "repeat(2, 1fr)" }, children: kpis2.map(([label2, value, note, color], index) => {
      const itemIn = p(localFrame, index * 7, 18 + index * 7);
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 18, opacity: itemIn, padding: 16, transform: `translateY(${(1 - itemIn) * 12}px)` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#667085", fontSize: 14, fontWeight: 650 }, children: label2 }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color, fontSize: 25, fontWeight: 840, letterSpacing: -0.2, marginTop: 6 }, children: value }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#8a8a8a", fontSize: 13, fontWeight: 520, marginTop: 3 }, children: note })
      ] }, label2);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 22, padding: "18px 18px 14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { alignItems: "end", borderBottom: "1px solid #e5e7eb", display: "grid", gap: 9, gridTemplateColumns: "repeat(8, 1fr)", height: 132, paddingBottom: 12 }, children: bars.map((height, index) => {
        const barIn = p(localFrame, 38 + index * 5, 58 + index * 5);
        const negative = index === 1 || index === 4;
        return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: negative ? "#fecaca" : index > 4 ? "#16a34a" : "#bfdbfe", borderRadius: "8px 8px 4px 4px", display: "block", height: height * barIn, minHeight: 6 } }, `${height}-${index}`);
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { color: "#667085", display: "flex", fontSize: 13, fontWeight: 650, justifyContent: "space-between", padding: "9px 4px 0" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "Hoje" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "7d" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "15d" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: "30d" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(InsightBlock, { localFrame: localFrame - 96, text: "Se Mercado Sul atrasar mais 7 dias, o saldo minimo cai para R$ 126k. Melhor antecipar cobranca hoje.", value: "Alerta de caixa" })
  ] });
}
function SpendEconomyInsightResult({ localFrame }) {
  const insights = [
    ["Gasto fora do padrao", "Frete Sul subiu 18% contra media dos ultimos 3 meses.", "Revisar contrato", "#fff7ed", "#c2410c"],
    ["Economia estimada", "Renegociar Cloud e frete libera R$ 38k no trimestre.", "+R$ 38k", "#f0fdf4", "#166534"],
    ["Margem protegida", "Reduzir midia com CPL alto melhora caixa sem cortar vendas.", "+4,2 p.p.", "#eff6ff", "#1d4ed8"]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 13, padding: "4px 22px 0" }, children: [
    insights.map(([label2, text, value, background, color], index) => {
      const itemIn = p(localFrame, 10 + index * 16, 34 + index * 16);
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background, border: "1px solid #e5e7eb", borderRadius: 20, display: "grid", gap: 16, gridTemplateColumns: "1fr auto", minHeight: 104, opacity: itemIn, padding: "18px 20px", transform: `translateY(${(1 - itemIn) * 16}px)` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 7 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("strong", { style: { color, fontSize: 20, fontWeight: 820, letterSpacing: -0.1 }, children: label2 }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#344054", fontSize: 16, fontWeight: 470, lineHeight: 1.25 }, children: text })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 999, color, fontSize: 18, fontWeight: 820, padding: "9px 12px", whiteSpace: "nowrap" }, children: value })
      ] }, label2);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#111827", borderRadius: 22, color: "#ffffff", opacity: p(localFrame, 78, 104), padding: 22, transform: `translateY(${(1 - p(localFrame, 78, 104)) * 14}px)` }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#52d273", fontSize: 18, fontWeight: 820 }, children: "Decisao recomendada" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#ffffff", fontSize: 22, fontWeight: 620, lineHeight: 1.25, marginTop: 8 }, children: "Segurar Frete Sul, renegociar fornecedor Cloud e manter Google Ads nos grupos com ROAS positivo." })
    ] })
  ] });
}
function EmployeeResult({ localFrame }) {
  const items = ["Rotina semanal configurada", "Permissoes com aprovacao humana", "Sistemas conectados ao Otto", "Funcionario de IA ativo"];
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { display: "grid", gap: 12, padding: "4px 24px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#050505", borderRadius: 26, color: "#ffffff", padding: 26 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#52d273", fontSize: 18, fontWeight: 760 }, children: "Novo funcionario" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { fontSize: 34, fontWeight: 840, letterSpacing: -0.3, marginTop: 8 }, children: "Analista de fornecedores" }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "rgba(255,255,255,0.68)", fontSize: 18, lineHeight: 1.32, marginTop: 8 }, children: "Revisa contratos, compras e pendencias toda sexta-feira." })
    ] }),
    items.map((item, index) => {
      const itemIn = p(localFrame, 38 + index * 8, 56 + index * 8);
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { alignItems: "center", background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 16, display: "grid", gap: 12, gridTemplateColumns: "30px 1fr auto", opacity: itemIn, padding: "12px 14px", transform: `translateY(${(1 - itemIn) * 10}px)` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { alignItems: "center", background: "#16a34a", borderRadius: 999, color: "#ffffff", display: "flex", fontSize: 16, fontWeight: 820, height: 30, justifyContent: "center", width: 30 }, children: "\u2713" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#111111", fontSize: 18, fontWeight: 620 }, children: item }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { style: { color: "#166534", fontSize: 15, fontWeight: 720 }, children: "OK" })
      ] }, item);
    })
  ] });
}
function InsightBlock({ localFrame, text, value }) {
  const cardIn = p(localFrame, 0, 18);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { style: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 18, opacity: cardIn, padding: 18, transform: `translateY(${(1 - cardIn) * 12}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#166534", fontSize: 22, fontWeight: 840 }, children: value }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { style: { color: "#37664a", fontSize: 16, fontWeight: 520, lineHeight: 1.28, marginTop: 7 }, children: text })
  ] });
}
var scenes = [
  {
    actions: [
      {
        result: {
          rows: [
            row("Receita Shopify", "Pedido importado e reconhecido", "R$ 18.400", "Receita", "SH", "#95bf47", "#f4faee", ShopifyIcon),
            row("Cliente Norte", "Servico aprovado no mes", "R$ 42.100", "Receita", "CN", "#0ea5e9", "#eff8ff"),
            row("Google Ads", "Campanha de aquisicao", "R$ 4.720", "Marketing", "G", "#4285f4", "#eef6ff", GoogleAdsIcon),
            row("Meta Ads", "Midia paga para remarketing", "R$ 3.460", "Marketing", "M", "#1877f2", "#edf5ff", MetaIcon),
            row("AWS Brasil", "Infraestrutura recorrente", "R$ 3.980", "Software", "AW", "#111827", "#f4f4f5"),
            row("OpenAI API", "Automacao e atendimento", "R$ 1.280", "Software", "AI", "#10a37f", "#ecfdf3"),
            row("Impostos federais", "Guia mensal vinculada", "R$ 12.300", "Impostos", "TX", "#f97316", "#fff7ed"),
            row("Frete Sul", "Envios e operacao logistica", "R$ 2.450", "Logistica", "FS", "#dc2626", "#fff1f2"),
            row("HubSpot", "CRM e pipeline comercial", "R$ 1.940", "Software", "HS", "#ff7a59", "#fff7ed"),
            row("Boleto Mercado Sul", "Recebimento parcial identificado", "R$ 8.400", "Receita", "MS", "#0ea5e9", "#eff8ff")
          ],
          subtitle: "Receitas, despesas, categorias e centros de custo",
          title: "Classificacao automatica"
        },
        summary: "Receitas e despesas foram organizadas por categoria, com itens recorrentes prontos para regra automatica.",
        tool: "classificar_receitas_despesas"
      }
    ],
    intro: "Vou organizar receitas e despesas, sugerir categorias e separar o que precisar de revisao.",
    prompt: "Organize e classifique receitas e despesas."
  },
  {
    actions: [
      {
        result: {
          kind: "reconciliation",
          rows: [
            row("PIX Cliente Norte", "Conta Azul \xB7 recebimento", "R$ 42.100", "Conciliado", "CN", "#0ea5e9", "#eff8ff", void 0, "NF-9031"),
            row("Cartao Stone", "Adquirente \xB7 lote diario", "R$ 68.900", "Conciliado", "ST", "#111827", "#f4f4f5", void 0, "Lote-552"),
            row("Boleto Rede Alpha", "Recebimento \xB7 retainer", "R$ 18.600", "Conciliado", "RA", "#1877f2", "#edf5ff", void 0, "CR-7721"),
            row("Shopify Payout", "Shopify \xB7 repasse ecommerce", "R$ 12.780", "Conciliado", "SH", "#95bf47", "#f4faee", ShopifyIcon, "PV-1182"),
            row("Tarifa bancaria", "Banco Inter \xB7 taxa avulsa", "R$ 189", "Revisar", "BI", "#f97316", "#fff7ed", void 0, "Sem lancamento"),
            row("Boleto Mercado Sul", "Recebimento \xB7 parcial", "R$ 8.400", "Divergencia", "MS", "#dc2626", "#fff1f2", void 0, "CR-4419"),
            row("Google Ads", "Cartao corporativo \xB7 marketing", "R$ 4.720", "Conciliado", "G", "#4285f4", "#eef6ff", GoogleAdsIcon, "MKT-884"),
            row("Fornecedor Cloud", "Pagamento \xB7 pedido nao vinculado", "R$ 18.400", "Revisar", "FC", "#7c3aed", "#f5f3ff", void 0, "Sem pedido"),
            row("Meta Ads", "Cartao corporativo \xB7 remarketing", "R$ 3.460", "Conciliado", "M", "#1877f2", "#edf5ff", MetaIcon, "MKT-921"),
            row("OpenAI API", "Assinatura internacional \xB7 software", "R$ 1.280", "Conciliado", "AI", "#10a37f", "#ecfdf3", void 0, "SFT-104")
          ],
          subtitle: "Banco, cartao e lancamentos no Otto",
          title: "Matching financeiro"
        },
        summary: "Conciliacao concluida com matches seguros, duas revisoes e uma divergencia para ajustar no Otto.",
        tool: "conciliar_bancos_cartoes"
      }
    ],
    intro: "Vou cruzar bancos, cartoes e movimentacoes financeiras com os lancamentos do Otto.",
    prompt: "Concilie bancos, cartoes e movimentacoes financeiras."
  },
  {
    actions: [
      {
        result: {
          kind: "table",
          rows: [
            row("AWS Brasil", "Vence em 3 dias", "R$ 12.790", "Prioridade", "AW", "#111827"),
            row("Google Ads", "Midia paga recorrente", "R$ 8.420", "A vencer", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Impostos federais", "Vencimento do mes", "R$ 31.200", "Prioridade", "TX", "#f97316"),
            row("Frete Sul", "Despesa acima do padrao", "R$ 6.830", "Revisar", "FS", "#dc2626"),
            row("Meta Ads", "Campanha de remarketing", "R$ 3.460", "A vencer", "M", "#1877f2", void 0, MetaIcon),
            row("Shopify", "Plano ecommerce mensal", "R$ 1.280", "Agendado", "SH", "#95bf47", void 0, ShopifyIcon),
            row("Conta Azul", "Assinatura ERP financeiro", "R$ 2.190", "A vencer", "CA", "#2563eb"),
            row("Banco Inter", "Tarifas e servicos bancarios", "R$ 840", "Revisar", "BI", "#f97316")
          ],
          subtitle: "Vencimentos, prioridades e risco",
          title: "Contas a pagar"
        },
        summary: "Encontrei 8 contas a pagar. Impostos, AWS e frete exigem prioridade nos proximos dias.",
        text: "Vou levantar as contas a pagar primeiro.",
        tool: "buscar_contas_a_pagar"
      },
      {
        result: {
          kind: "table",
          rows: [
            row("Cliente Norte", "NF-9031 vence em 5 dias", "R$ 42.100", "Previsto", "CN", "#0ea5e9"),
            row("Rede Alpha", "Retainer de performance", "R$ 18.600", "A vencer", "RA", "#1877f2"),
            row("Mercado Sul", "Pagamento em atraso", "R$ 28.900", "Atraso", "MS", "#dc2626"),
            row("Norte Foods", "Projeto fiscal aprovado", "R$ 31.400", "Confirmado", "NF", "#f97316"),
            row("Canal B2B", "Receita de campanha Google", "R$ 54.700", "Confirmado", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Loja Prime", "Pedidos integrados Shopify", "R$ 16.800", "Previsto", "SH", "#95bf47", void 0, ShopifyIcon),
            row("Grupo Delta", "Contrato mensal recorrente", "R$ 76.500", "Previsto", "GD", "#7c3aed"),
            row("Shopify Store", "Repasse ecommerce pendente", "R$ 12.780", "A vencer", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "Entradas previstas e atrasos",
          title: "Contas a receber"
        },
        summary: "As entradas cobrem os vencimentos, mas Mercado Sul pressiona o caixa se atrasar mais 7 dias.",
        text: "Agora vou puxar recebimentos, vendas faturadas e atrasos no contas a receber.",
        tool: "buscar_contas_a_receber"
      },
      {
        result: {
          kind: "table",
          rows: [
            row("Fornecedor Cloud", "Pedido PO-442 aprovado", "R$ 18.400", "Revisar", "FC", "#7c3aed"),
            row("AWS Brasil", "Infra recorrente vinculada ao contrato", "R$ 12.790", "Recorrente", "AW", "#111827"),
            row("Frete Sul", "Contrato logistico com reajuste", "R$ 6.830", "Acima do padrao", "FS", "#dc2626"),
            row("Google Ads", "Compra de midia programada", "R$ 8.420", "Aprovado", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Meta Ads", "Campanha remarketing do mes", "R$ 3.460", "Aprovado", "M", "#1877f2", void 0, MetaIcon),
            row("Shopify", "Plano e apps ecommerce", "R$ 1.280", "OK", "SH", "#95bf47", void 0, ShopifyIcon),
            row("Conta Azul", "ERP legado em transicao", "R$ 2.190", "Avaliar", "CA", "#2563eb"),
            row("Escritorio Fiscal", "Honorarios mensais", "R$ 4.800", "Agendado", "EF", "#f97316")
          ],
          subtitle: "Compras, pedidos, valores e status",
          title: "Compras"
        },
        summary: "Compras foram cruzadas com pagamentos. Frete Sul e Fornecedor Cloud merecem revisao antes de executar.",
        text: "Vou buscar compras e pedidos vinculados aos pagamentos.",
        tool: "buscar_compras"
      },
      {
        result: {
          kind: "table",
          rows: [
            row("Cliente Norte", "Venda de servico aprovada", "R$ 12.400", "Registrada", "CN", "#0ea5e9"),
            row("Mercado Sul", "Pedido comercial importado", "R$ 28.900", "Faturar", "MS", "#dc2626"),
            row("Rede Alpha", "Venda recorrente renovada", "R$ 18.600", "Registrada", "RA", "#1877f2"),
            row("Loja Prime", "Venda ecommerce Shopify", "R$ 16.800", "Faturada", "SH", "#95bf47", void 0, ShopifyIcon),
            row("Canal B2B", "Venda de performance", "R$ 54.700", "Faturada", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Norte Foods", "Venda de projeto fiscal", "R$ 31.400", "Registrada", "NF", "#f97316"),
            row("Grupo Delta", "Venda enterprise aprovada", "R$ 76.500", "Registrar", "GD", "#7c3aed"),
            row("Shopify Store", "Venda integrada da loja", "R$ 12.780", "Faturada", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "Vendas, clientes, valores e faturamento",
          title: "Vendas"
        },
        summary: "Oito vendas foram encontradas. Mercado Sul precisa faturamento e Grupo Delta deve ser registrado no ERP.",
        text: "Agora vou buscar vendas registradas e status de faturamento.",
        tool: "buscar_vendas"
      },
      {
        result: {
          kind: "cashflow",
          subtitle: "Entradas, saidas, vencimentos e atrasos",
          title: "Fluxo de caixa"
        },
        summary: "O caixa segue positivo, mas dois atrasos podem reduzir a folga da proxima semana. Recomendo cobrar Mercado Sul hoje.",
        text: "Com pagar, receber, compras e vendas cruzados, vou analisar o fluxo de caixa da operacao.",
        tool: "analisar_fluxo_caixa"
      },
      {
        result: {
          kind: "insights",
          subtitle: "Gastos fora do padrao, economia e margem",
          title: "Economia e margem"
        },
        summary: "Identifiquei oportunidade de economia em frete, cloud e midia paga. O impacto estimado e de R$ 38 mil no trimestre.",
        text: "Agora vou identificar onde a empresa esta gastando demais, perdendo dinheiro ou pode economizar.",
        tool: "identificar_gastos_e_economias"
      }
    ],
    intro: "Vou revisar a operacao financeira: pagamentos, recebimentos, compras, vendas, cobrancas, caixa e economia.",
    prompt: "Acompanhe contas a pagar e receber, compras, vendas, cobrancas, pagamentos e recebimentos."
  },
  {
    actions: [
      {
        result: {
          kind: "dashboardOutline",
          subtitle: "Dashboard \xB7 Tempo real",
          title: "dashboard_financeiro"
        },
        summary: "Dashboard financeiro gerado para acompanhar caixa, contas a pagar, contas a receber, atrasos e margem.",
        text: "Agora vou montar um dashboard financeiro para acompanhar caixa, vencimentos, recebimentos e atrasos.",
        tool: "gerar_dashboard_financeiro"
      },
      {
        result: {
          kind: "reportOutline",
          subtitle: "Relat\xF3rio \xB7 PDF",
          title: "relatorio_vendas_mes"
        },
        summary: "Relatorio criado com resumo das vendas do mes, clientes, valores faturados e itens pendentes de cobranca.",
        text: "Depois vou gerar um relatorio com o resumo das vendas deste mes.",
        tool: "gerar_relatorio_vendas_mes"
      }
    ],
    intro: "Com base nesses dados, vou criar um dashboard financeiro e um relatorio de vendas do mes.",
    prompt: "Agora crie um dashboard para acompanhar meu financeiro e um relatorio com o resumo das minhas vendas deste mes."
  },
  {
    actions: [
      {
        result: {
          kind: "invoiceOutline",
          subtitle: "Nota fiscal \xB7 NFS-e",
          title: "nota_fiscal_servico_2048"
        },
        summary: "Nota emitida com PDF, XML, tomador validado e impostos calculados. Agora vou acompanhar prazos e obrigacoes.",
        tool: "emitir_nota_fiscal"
      },
      {
        result: {
          rows: [
            row("ISS retido", "Nota NFS-e 2048 vinculada", "R$ 248", "Calculado", "IS", "#16a34a"),
            row("DAS", "Guia mensal separada", "R$ 8.200", "Programado", "DA", "#f97316"),
            row("DCTFWeb", "Declaracao a revisar", "1 item", "Pendente", "DF", "#dc2626"),
            row("SPED fiscal", "Competencia atual conferida", "OK", "Em dia", "SP", "#2563eb"),
            row("Certidoes", "Validade monitorada", "30 dias", "Monitorado", "CE", "#7c3aed"),
            row("Livro fiscal", "Notas e XML atualizados", "12 docs", "Atualizado", "LF", "#111827")
          ],
          subtitle: "Prazos, guias, declaracoes e registros",
          title: "Prazos e obrigacoes fiscais"
        },
        summary: "Obrigacoes acompanhadas. DCTFWeb ficou pendente para revisao antes do envio.",
        text: "Vou acompanhar prazos, guias e obrigacoes fiscais vinculadas a nota e ao mes atual.",
        tool: "acompanhar_obrigacoes_fiscais"
      },
      {
        result: {
          rows: [
            row("ISS servicos", "Aliquota aplicada acima da media", "+R$ 420", "Revisar", "IS", "#dc2626"),
            row("Credito PIS/COFINS", "Despesa elegivel nao aproveitada", "+R$ 1.180", "Economia", "PC", "#16a34a"),
            row("Retencoes", "Cliente Norte validado", "OK", "Correto", "RT", "#2563eb"),
            row("DAS projetado", "Receita do mes recalculada", "-R$ 640", "Economia", "DA", "#f97316"),
            row("Nota Mercado Sul", "Dados fiscais incompletos", "1 item", "Pendente", "MS", "#7c3aed"),
            row("Simples Nacional", "Faixa efetiva monitorada", "11,8%", "OK", "SN", "#111827")
          ],
          subtitle: "Inconsistencias, pagamentos acima e economia",
          title: "Analise de impostos"
        },
        summary: "Encontrei possivel economia de R$ 2.240 e um ponto de revisao no ISS antes do proximo fechamento fiscal.",
        text: "Agora vou analisar impostos para identificar inconsistencias, pagamentos acima do necessario e oportunidades de economia.",
        tool: "analisar_impostos_empresa"
      }
    ],
    intro: "Vou emitir a nota fiscal do servico aprovado, depois acompanhar prazos, obrigacoes e analisar impostos em busca de inconsistencias e economia.",
    prompt: "Emita a nota fiscal do ultimo servico aprovado e revise impostos, prazos e obrigacoes fiscais."
  },
  {
    actions: [
      {
        result: {
          rows: [
            row("Mercado Sul", "28 dias em atraso", "R$ 3.482,70", "Prioridade", "MS", "#dc2626"),
            row("Cliente Norte", "12 dias em atraso", "R$ 5.940,35", "Prioridade", "CN", "#0ea5e9"),
            row("Loja Prime", "Boleto venceu ontem", "R$ 1.286,90", "Acompanhar", "LP", "#f97316"),
            row("Rede Alpha", "18 dias em atraso", "R$ 2.174,55", "Prioridade", "RA", "#1877f2"),
            row("Norte Foods", "NF vencida ha 7 dias", "R$ 4.812,20", "Acompanhar", "NF", "#16a34a"),
            row("Canal B2B", "Parcela sem baixa", "R$ 6.390,80", "Revisar", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Grupo Delta", "Contrato mensal pendente", "R$ 7.158,45", "Prioridade", "GD", "#7c3aed"),
            row("Shopify Store", "Repasse parcial recebido", "R$ 1.934,12", "Acompanhar", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "Clientes, valores e dias em atraso",
          title: "Clientes em atraso"
        },
        summary: "Identifiquei 8 clientes em atraso, com R$ 33.180,07 em aberto. Mercado Sul, Grupo Delta e Cliente Norte exigem prioridade.",
        tool: "buscar_clientes_em_atraso"
      },
      {
        result: {
          rows: [
            row("Mercado Sul", "financeiro@mercadosul.com.br", "R$ 3.482,70", "Enviado", "MS", "#dc2626"),
            row("Cliente Norte", "contas@clientenorte.com.br", "R$ 5.940,35", "Enviado", "CN", "#0ea5e9"),
            row("Loja Prime", "adm@lojaprime.com.br", "R$ 1.286,90", "Enviado", "LP", "#f97316"),
            row("Rede Alpha", "financeiro@redealpha.com.br", "R$ 2.174,55", "Enviado", "RA", "#1877f2"),
            row("Norte Foods", "pagamentos@nortefoods.com.br", "R$ 4.812,20", "Enviado", "NF", "#16a34a"),
            row("Canal B2B", "cobranca@canalb2b.com.br", "R$ 6.390,80", "Enviado", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Grupo Delta", "financeiro@grupodelta.com.br", "R$ 7.158,45", "Enviado", "GD", "#7c3aed"),
            row("Shopify Store", "owner@shopifystore.com.br", "R$ 1.934,12", "Enviado", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "E-mails enviados, segunda via e historico",
          title: "Cobrancas por e-mail"
        },
        summary: "E-mails de cobranca enviados com segunda via, valor em aberto e historico registrado no contas a receber.",
        text: "Vou enviar as cobrancas por e-mail com segunda via, valor atualizado e prazo para pagamento.",
        tool: "enviar_cobrancas_email"
      },
      {
        result: {
          rows: [
            row("Mercado Sul", "+55 11 94218-7704", "R$ 3.482,70", "Enviado", "MS", "#25d366"),
            row("Cliente Norte", "+55 85 99104-2281", "R$ 5.940,35", "Enviado", "CN", "#0ea5e9"),
            row("Loja Prime", "+55 11 97842-6630", "R$ 1.286,90", "Enviado", "LP", "#f97316"),
            row("Rede Alpha", "+55 21 98216-4409", "R$ 2.174,55", "Enviado", "RA", "#1877f2"),
            row("Norte Foods", "+55 81 99672-1180", "R$ 4.812,20", "Enviado", "NF", "#16a34a"),
            row("Canal B2B", "+55 31 97158-0294", "R$ 6.390,80", "Enviado", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Grupo Delta", "+55 41 98744-5520", "R$ 7.158,45", "Enviado", "GD", "#7c3aed"),
            row("Shopify Store", "+55 47 99288-6315", "R$ 1.934,12", "Enviado", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "Mensagens enviadas, link de pagamento e historico",
          title: "Cobrancas por WhatsApp"
        },
        summary: "Mensagens de WhatsApp enviadas com link de pagamento e historico anexado aos clientes em atraso.",
        text: "Agora vou reforcar a cobranca pelo WhatsApp usando o telefone cadastrado de cada cliente.",
        tool: "enviar_cobrancas_whatsapp"
      },
      {
        result: {
          rows: [
            row("Cliente Norte", "PIX recebido parcialmente", "R$ 2.400,00", "Pago parcial", "CN", "#0ea5e9"),
            row("Loja Prime", "Cliente respondeu no WhatsApp", "Hoje", "Respondido", "LP", "#25d366"),
            row("Mercado Sul", "Follow-up agendado", "Amanha", "Aguardando", "MS", "#dc2626"),
            row("Rede Alpha", "Boleto aberto pelo cliente", "2h atras", "Visualizado", "RA", "#1877f2"),
            row("Norte Foods", "Pagamento prometido", "Sexta", "Acompanhar", "NF", "#16a34a"),
            row("Canal B2B", "Comprovante solicitado", "Pendente", "Revisar", "G", "#4285f4", void 0, GoogleAdsIcon),
            row("Grupo Delta", "Sem resposta ainda", "24h", "Escalar", "GD", "#7c3aed"),
            row("Shopify Store", "Saldo liquidado", "R$ 1.934,12", "Recebido", "SH", "#95bf47", void 0, ShopifyIcon)
          ],
          subtitle: "Resposta, recebimento, follow-up e proximo passo",
          title: "Acompanhamento ate recebimento"
        },
        summary: "Recebimentos acompanhados: um cliente liquidou, um pagou parcialmente e os casos criticos ficaram com proximo passo definido.",
        text: "Agora vou acompanhar respostas, recebimentos e proximos passos ate a baixa no contas a receber.",
        tool: "acompanhar_recebimentos_cobrancas"
      }
    ],
    intro: "Vou localizar clientes em atraso, enviar cobrancas por e-mail, reforcar no WhatsApp e acompanhar cada caso ate o recebimento.",
    prompt: "Monitore clientes em atraso, envie cobrancas por e-mail e WhatsApp e acompanhe ate o recebimento."
  },
  {
    actions: [
      {
        result: {
          kind: "employee",
          subtitle: "Rotina, permissoes e aprovacao humana",
          title: "Funcionario de IA criado"
        },
        summary: "Funcionario criado e pronto para automatizar o processo com seguranca e aprovacao humana.",
        tool: "criar_funcionario_ia"
      }
    ],
    intro: "Vou criar um funcionario de IA com rotina, permissoes e limites de execucao dentro do Otto.",
    prompt: "Crie um funcionario de IA para automatizar um processo da minha empresa."
  }
];
function row(name, description, value, status, initials, tone, background, icon, erp) {
  return { background, description, erp, icon, initials, name, status, tone, value };
}

// src/assets/remotion/compositions/OttoLogoRevealHorizontal.tsx
var import_jsx_runtime45 = __toESM(require_jsx_runtime());
var OTTO_LOGO_REVEAL_HORIZONTAL_INTRO_DURATION = 51;
var INK = "#242424";
function progress(frame, start, end) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}
function OttoLogoRevealHorizontal() {
  const frame = useCurrentFrame();
  const logo = progress(frame, 0, 36);
  const clip = interpolate(logo, [0, 1], [100, 0]);
  const logoX = interpolate(logo, [0, 1], [-36, 0]);
  const lockupScale = interpolate(frame, [0, OTTO_LOGO_REVEAL_HORIZONTAL_INTRO_DURATION], [1.04, 0.98], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(AbsoluteFill, { style: { background: "#ffffff", color: INK, fontFamily: "Inter, Arial, Helvetica, sans-serif", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
    "div",
    {
      style: {
        alignItems: "center",
        display: "flex",
        left: "50%",
        opacity: interpolate(logo, [0, 0.28, 1], [0, 1, 1]),
        overflow: "hidden",
        position: "absolute",
        top: 330,
        transform: `translate(-50%, -50%) scale(${lockupScale})`
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
        Img,
        {
          src: staticFile("logoOtto.svg"),
          style: {
            clipPath: `inset(0 ${clip}% 0 0)`,
            display: "block",
            filter: `blur(${interpolate(logo, [0, 1], [1.2, 0])}px)`,
            height: 647,
            transform: `translateX(${logoX}px)`,
            width: 1500
          }
        }
      )
    }
  ) });
}

// src/assets/remotion/compositions/PromptToChartExactVideo.tsx
var import_jsx_runtime46 = __toESM(require_jsx_runtime());
var PROMPT_SCENE_DURATION = 150;
var PROMPT = "Give me a pie chart showing the energy sources used in these markets";
var FONT = "Arial, Helvetica, sans-serif";
function progress2(frame, from, to, output = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}
function ExactPromptInputScene({ duration = PROMPT_SCENE_DURATION, label: label2, prompt = PROMPT }) {
  const frame = useCurrentFrame();
  const typingEnd = Math.min(106, duration - 34);
  const visibleCharacters = Math.floor(progress2(frame, 14, typingEnd, [0, prompt.length]));
  const exit = progress2(frame, duration - 20, duration, [1, 0]);
  const showCursor = frame < 112 && Math.floor(frame / 10) % 2 === 0;
  const labelIn = progress2(frame, 0, 14);
  return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
    AbsoluteFill,
    {
      style: {
        alignItems: "center",
        background: "#fbfdfc",
        display: "flex",
        fontFamily: FONT,
        justifyContent: "center",
        opacity: exit
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { style: { display: "grid", gap: 28, justifyItems: "center" }, children: [
        label2 ? /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { style: { color: "#202124", fontSize: 28, fontWeight: 500, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 8}px)` }, children: label2 }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(
          "div",
          {
            style: {
              alignItems: "center",
              background: "#ffffff",
              border: "1.5px solid #d8ddda",
              borderRadius: 999,
              boxShadow: "0 2px 5px rgba(20, 24, 22, 0.05)",
              display: "grid",
              gridTemplateColumns: "52px minmax(0, 1fr) auto 46px 54px",
              height: 66,
              padding: "0 10px 0 12px",
              width: 920
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { style: { alignItems: "center", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Plus, { color: "#252525", size: 26, strokeWidth: 1.8 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { style: { alignItems: "center", display: "flex", minWidth: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { style: { color: "#202124", fontSize: 19, fontWeight: 400, letterSpacing: 0, whiteSpace: "nowrap" }, children: [
                prompt.slice(0, visibleCharacters),
                showCursor ? /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { style: { borderRight: "1.5px solid #202124", marginLeft: 1 }, children: "\xA0" }) : null
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { style: { alignItems: "center", color: "#969a97", display: "flex", fontSize: 16, gap: 5, marginLeft: 18, whiteSpace: "nowrap" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { children: "Instant" }),
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(ChevronDown, { size: 16, strokeWidth: 1.7 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { style: { alignItems: "center", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Mic, { color: "#242424", size: 23, strokeWidth: 1.9 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { style: { alignItems: "center", background: "#050505", borderRadius: 999, display: "flex", height: 44, justifyContent: "center", width: 44 }, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(ArrowUp, { color: "#ffffff", size: 26, strokeWidth: 2.4 }) })
            ]
          }
        )
      ] })
    }
  );
}

// src/assets/remotion/compositions/OttoFinancialDashboard.tsx
var import_jsx_runtime47 = __toESM(require_jsx_runtime());
loadSfProFonts();
var FONT2 = IOS_REMOTION_FONT_STACK;
var INK2 = "#171918";
var MUTED = "#727774";
var BORDER = "#e3e7e5";
var GREEN = "#16845b";
var BLUE = "#3d91d8";
var ORANGE = "#df7548";
function p2(frame, from, to, output = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}
function money(value) {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}
var kpis = [
  { accent: BLUE, delta: "+12,4%", icon: TrendingUp, label: "Receita", positive: true, value: 48610 },
  { accent: ORANGE, delta: "-4,8%", icon: TrendingDown, label: "Despesas", positive: true, value: 24730 },
  { accent: GREEN, delta: "+18,1%", icon: WalletCards, label: "Saldo projetado", positive: true, value: 23880 },
  { accent: "#b45309", delta: "6 clientes", icon: CircleAlert, label: "Em atraso", positive: false, value: 21520 }
];
var chartSeries = [
  { color: BLUE, name: "Recebimentos", values: [66, 82, 93, 105, 116, 128] },
  { color: ORANGE, name: "Pagamentos", values: [54, 62, 70, 75, 81, 88] }
];
function chartPath(values) {
  return values.map((value, index) => {
    const x = 54 + index * 132;
    const y = 196 - value / 140 * 166;
    return `${index === 0 ? "M" : "L"} ${x} ${y.toFixed(1)}`;
  }).join(" ");
}
function KpiCard({ index }) {
  const frame = useCurrentFrame();
  const item = kpis[index];
  const Icon2 = item.icon;
  const enter = p2(frame, 8 + index * 7, 28 + index * 7);
  const value = p2(frame, 16 + index * 7, 62 + index * 7, [0, item.value]);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, padding: "16px 18px", transform: `translateY(${(1 - enter) * 12}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", display: "flex", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, fontSize: 13, fontWeight: 600 }, children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { alignItems: "center", background: `${item.accent}14`, borderRadius: 7, color: item.accent, display: "flex", height: 30, justifyContent: "center", width: 30 }, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Icon2, { size: 17, strokeWidth: 2.1 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { color: INK2, display: "block", fontSize: 25, fontWeight: 720, marginTop: 8 }, children: money(value) }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", color: item.positive ? GREEN : "#b45309", display: "flex", fontSize: 11, fontWeight: 650, gap: 4, marginTop: 4 }, children: [
      item.positive ? /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ArrowUpRight, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Clock3, { size: 13 }),
      item.delta
    ] })
  ] });
}
function CashFlowPanel() {
  const frame = useCurrentFrame();
  const enter = p2(frame, 30, 50);
  const draw = p2(frame, 42, 104);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { style: { background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, overflow: "hidden", transform: `translateY(${(1 - enter) * 10}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("header", { style: { alignItems: "center", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", padding: "14px 18px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { display: "block", fontSize: 15 }, children: "Fluxo de caixa" }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, fontSize: 11 }, children: "Proje\xE7\xE3o para os pr\xF3ximos seis meses" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { alignItems: "center", display: "flex", gap: 16 }, children: chartSeries.map((series) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { style: { alignItems: "center", color: MUTED, display: "flex", fontSize: 11, gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("i", { style: { background: series.color, borderRadius: 999, height: 7, width: 7 } }),
        series.name
      ] }, series.name)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { padding: "8px 14px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("svg", { height: "250", viewBox: "0 0 760 250", width: "100%", children: [
      [0, 40, 80, 120].map((value) => {
        const y = 196 - value / 140 * 166;
        return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("line", { stroke: "#e8ecea", strokeDasharray: "3 4", x1: "54", x2: "714", y1: y, y2: y }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("text", { fill: MUTED, fontFamily: FONT2, fontSize: "10", textAnchor: "end", x: "45", y: y + 4, children: value === 0 ? "R$ 0" : `R$ ${value}k` })
        ] }, value);
      }),
      ["Ago", "Set", "Out", "Nov", "Dez", "Jan"].map((month, index) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("text", { fill: MUTED, fontFamily: FONT2, fontSize: "10", textAnchor: "middle", x: 54 + index * 132, y: "221", children: month }, month)),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("clipPath", { id: "dashboard-line-reveal", children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("rect", { height: "230", width: 720 * draw, x: "0", y: "0" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("g", { clipPath: "url(#dashboard-line-reveal)", children: chartSeries.map((series) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("path", { d: chartPath(series.values), fill: "none", stroke: series.color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" }, series.name)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("footer", { style: { borderTop: `1px solid ${BORDER}`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", minHeight: 62 }, children: [["Maior entrada", "R$ 128 mil"], ["Caixa m\xEDnimo", "R$ 12 mil"], ["Saldo em janeiro", "R$ 40 mil"]].map(([label2, value], index) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { borderLeft: index ? `1px solid ${BORDER}` : "none", padding: "12px 18px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, display: "block", fontSize: 10 }, children: label2 }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { fontSize: 14 }, children: value })
    ] }, label2)) })
  ] });
}
function RevenuePanel() {
  const frame = useCurrentFrame();
  const rows = [
    { color: BLUE, label: "Servi\xE7os", value: 76 },
    { color: GREEN, label: "Assinaturas", value: 58 },
    { color: "#a587dc", label: "Projetos", value: 42 }
  ];
  const enter = p2(frame, 38, 58);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { style: { background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, padding: "16px 18px", transform: `translateY(${(1 - enter) * 10}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { display: "block", fontSize: 15 }, children: "Receita por origem" }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, fontSize: 11 }, children: "Participa\xE7\xE3o no per\xEDodo" }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { display: "grid", gap: 14, marginTop: 18 }, children: rows.map((item, index) => {
      const rowIn = p2(frame, 54 + index * 8, 76 + index * 8);
      return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", display: "flex", fontSize: 11, justifyContent: "space-between", marginBottom: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { children: item.label }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("strong", { children: [
            item.value,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { background: "#edf0ee", borderRadius: 999, height: 7, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { background: item.color, borderRadius: 999, height: "100%", width: `${item.value * rowIn}%` } }) })
      ] }, item.label);
    }) })
  ] });
}
function StatusPanel() {
  const frame = useCurrentFrame();
  const rows = [
    { icon: CircleCheck, label: "Financeiro atualizado", tone: GREEN, value: "Agora" },
    { icon: ReceiptText, label: "Notas fiscais emitidas", tone: BLUE, value: "8 notas" },
    { icon: CircleAlert, label: "Cobran\xE7as monitoradas", tone: "#b45309", value: "6 clientes" }
  ];
  const enter = p2(frame, 48, 68);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { style: { background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, overflow: "hidden", transform: `translateY(${(1 - enter) * 10}px)` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { borderBottom: `1px solid ${BORDER}`, padding: "13px 18px" }, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { fontSize: 15 }, children: "Status operacional" }) }),
    rows.map((item, index) => {
      const Icon2 = item.icon;
      const rowIn = p2(frame, 66 + index * 8, 84 + index * 8);
      return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", borderTop: index ? `1px solid ${BORDER}` : "none", display: "grid", gridTemplateColumns: "28px 1fr auto", minHeight: 48, opacity: rowIn, padding: "0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Icon2, { color: item.tone, size: 17 }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { fontSize: 11.5, fontWeight: 570 }, children: item.label }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { color: MUTED, fontSize: 10.5 }, children: item.value })
      ] }, item.label);
    })
  ] });
}
function OttoFinancialDashboard() {
  const frame = useCurrentFrame();
  const shellIn = p2(frame, 0, 20);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(AbsoluteFill, { style: { background: "#f5f7f6", color: INK2, fontFamily: FONT2, opacity: shellIn, overflow: "hidden" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("header", { style: { alignItems: "center", background: "#ffffff", borderBottom: `1px solid ${BORDER}`, display: "flex", height: 64, justifyContent: "space-between", padding: "0 28px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", display: "flex", gap: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Img, { src: staticFile("logoOttoIcon.svg"), style: { height: 30, width: 30 } }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { style: { display: "block", fontSize: 16 }, children: "Vis\xE3o financeira" }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, fontSize: 11 }, children: "Atualizado agora pela Otto" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { color: MUTED, fontSize: 11 }, children: "Per\xEDodo" }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { style: { background: "#f3f5f4", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11, fontWeight: 650, padding: "8px 11px" }, children: "\xDAltimos 30 dias" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("main", { style: { display: "grid", gap: 16, padding: "20px 28px 24px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { style: { display: "grid", gap: 14, gridTemplateColumns: "repeat(4, 1fr)" }, children: kpis.map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KpiCard, { index }, kpis[index].label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 0.92fr)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(CashFlowPanel, {}),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { style: { display: "grid", gap: 14, gridTemplateRows: "1fr auto" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(RevenuePanel, {}),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(StatusPanel, {})
        ] })
      ] })
    ] })
  ] });
}

// src/assets/remotion/saas/motionComponents.tsx
var import_react86 = __toESM(require_react());
var import_jsx_runtime48 = __toESM(require_jsx_runtime());
function TypingText({
  cursor = true,
  delay = 0,
  speed = 1.2,
  style,
  text,
  theme
}) {
  const frame = useCurrentFrame();
  const visibleChars = Math.min(text.length, Math.floor(Math.max(0, frame - delay) * speed));
  const showCursor = cursor && Math.floor(frame / 14) % 2 === 0;
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("span", { style: { color: theme.text, fontWeight: 760, letterSpacing: 0, ...style }, children: [
    text.slice(0, visibleChars),
    showCursor ? /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { style: { color: theme.accent }, children: "_" }) : null
  ] });
}

// src/components/icons/AmazonIcon.tsx
var import_jsx_runtime49 = __toESM(require_jsx_runtime());
function AmazonIcon({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(
    "svg",
    {
      className,
      xmlns: "http://www.w3.org/2000/svg",
      width: "48",
      height: "48",
      viewBox: "0 0 48 48",
      id: "amazon",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("rect", { width: "48", height: "48", fill: "#ffffff", rx: "6" }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("g", { id: "Icons", fill: "none", fillRule: "evenodd", stroke: "none", strokeWidth: "1", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("g", { id: "Color-", transform: "translate(-601 -560)", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("g", { id: "Amazon", transform: "translate(601 560)", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("path", { fill: "#343B45", d: "M25.403 25.96c-.743 1.482-2.015 2.436-3.393 2.758-.208 0-.527.105-.846.105-2.329 0-3.706-1.802-3.706-4.45 0-3.394 2.012-4.981 4.552-5.726 1.378-.317 2.97-.424 4.558-.424v1.273c0 2.437.105 4.343-1.165 6.464zm1.165-12.608c-1.377.105-2.969.21-4.558.418-2.435.322-4.87.746-6.88 1.7-3.92 1.59-6.57 4.98-6.57 9.959 0 6.257 4.024 9.433 9.113 9.433 1.693 0 3.07-.214 4.337-.528 2.018-.638 3.709-1.804 5.721-3.925 1.166 1.59 1.487 2.335 3.497 4.03.53.209 1.06.209 1.481-.105 1.273-1.062 3.5-2.97 4.663-4.03.53-.423.426-1.06.104-1.586-1.163-1.485-2.331-2.758-2.331-5.619v-9.538c0-4.026.322-7.736-2.645-10.489C30.065.85 26.25 0 23.283 0H22.01C16.612.313 10.894 2.646 9.618 9.323c-.212.85.426 1.166.85 1.27l5.932.743c.635-.107.954-.638 1.058-1.163.528-2.332 2.436-3.498 4.552-3.713h.427c1.272 0 2.65.531 3.389 1.593.847 1.27.742 2.967.742 4.452v.847z" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("path", { id: "Fill-237", fill: "#FF9A00", d: "M47.994 35.946v-.002c-.022-.5-.127-.881-.335-1.198l-.023-.03-.025-.032c-.212-.231-.415-.319-.635-.415-.658-.254-1.615-.39-2.766-.392-.827 0-1.739.079-2.656.28l-.003-.063-.923.308-.017.008-.522.17v.022a8.17 8.17 0 0 0-1.684.946c-.322.24-.587.56-.602 1.048a.978.978 0 0 0 .35.75 1.119 1.119 0 0 0 .861.232l.045-.002.034-.006c.452-.096 1.11-.161 1.88-.268.66-.074 1.36-.127 1.967-.127.429-.003.815.028 1.08.084a1.208 1.208 0 0 1 .328.11.955.955 0 0 1 .025.266c.006.508-.208 1.451-.505 2.372-.288.92-.638 1.843-.869 2.456a1.246 1.246 0 0 0-.093.466c-.006.246.096.545.31.743.21.197.48.276.706.276h.011c.339-.003.627-.138.875-.333 2.343-2.106 3.158-5.472 3.192-7.367l-.006-.302zm-6.945 2.92a1.645 1.645 0 0 0-.714.16c-.257.102-.52.221-.768.326l-.364.152-.474.19v.005c-5.15 2.09-10.56 3.315-15.567 3.422-.184.006-.37.006-.548.006-7.874.005-14.297-3.648-20.777-7.248a1.482 1.482 0 0 0-.685-.181c-.291 0-.59.11-.808.313a1.108 1.108 0 0 0-.344.805c-.003.392.209.754.505.988C6.587 43.087 13.253 47.994 22.22 48c.175 0 .353-.006.53-.008 5.704-.128 12.153-2.056 17.16-5.201l.03-.02a17.54 17.54 0 0 0 1.928-1.333c.384-.285.65-.731.65-1.194-.017-.822-.715-1.378-1.468-1.378z" })
        ] }) }) })
      ]
    }
  );
}

// src/components/icons/ContaAzulIcon.tsx
var import_jsx_runtime50 = __toESM(require_jsx_runtime());
function ContaAzulIcon({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(
    "img",
    {
      src: "https://i.imgur.com/Se4xr90.png",
      alt: "ContaAzul",
      className,
      style: { objectFit: "cover" }
    }
  );
}

// src/components/icons/HubspotIcon.tsx
var import_jsx_runtime51 = __toESM(require_jsx_runtime());
function HubspotIcon({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
    "img",
    {
      src: "https://i.imgur.com/ukCpSXu.png",
      alt: "HubSpot",
      className,
      style: { objectFit: "cover" }
    }
  );
}

// src/assets/remotion/compositions/OttoFinanceAi50sVideo.tsx
var import_jsx_runtime52 = __toESM(require_jsx_runtime());
loadSfProFonts();
var OTTO_FINANCE_AI_50S_DURATION = 1500;
var FONT3 = IOS_REMOTION_FONT_STACK;
var INK3 = "#181818";
var MUTED2 = "#747474";
var typingTheme = {
  accent: INK3,
  accent2: MUTED2,
  background: "#ffffff",
  border: "#e5e7eb",
  fontFamily: FONT3,
  muted: MUTED2,
  panel: "#ffffff",
  positive: "#16845b",
  text: INK3
};
function p3(frame, from, to, output = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}
function Scene({ children, duration }) {
  const frame = useCurrentFrame();
  const opacity = p3(frame, 0, 12) * p3(frame, duration - 12, duration, [1, 0]);
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(AbsoluteFill, { style: { background: "#ffffff", color: INK3, fontFamily: FONT3, opacity, overflow: "hidden" }, children });
}
function row2(value) {
  return value;
}
var reconciliationRows = [
  row2({ description: "PIX recebido \xB7 03 ago", erp: "Venda #1842", initials: "PX", name: "Banco principal", status: "Conciliado", tone: "#0f766e", value: "R$ 4.800" }),
  row2({ description: "Cart\xE3o corporativo \xB7 03 ago", erp: "Software", initials: "CC", name: "Cart\xE3o empresarial", status: "Conciliado", tone: "#2563eb", value: "R$ 920" }),
  row2({ description: "TED recebida \xB7 04 ago", erp: "Cliente Aurora", initials: "TD", name: "Conta corrente", status: "Conciliado", tone: "#7c3aed", value: "R$ 7.250" }),
  row2({ description: "D\xE9bito autom\xE1tico \xB7 04 ago", erp: "Energia", initials: "DA", name: "Banco principal", status: "Conciliado", tone: "#d97757", value: "R$ 1.460" }),
  row2({ description: "Boleto compensado \xB7 05 ago", erp: "Fornecedor Delta", initials: "BL", name: "Conta pagamentos", status: "Conciliado", tone: "#0891b2", value: "R$ 2.640" }),
  row2({ description: "Tarifa banc\xE1ria \xB7 05 ago", erp: "Despesas banc\xE1rias", initials: "TB", name: "Banco principal", status: "Conciliado", tone: "#475569", value: "R$ 89" })
];
var expenseRows = [
  row2({ description: "Campanha de m\xEDdia paga", icon: MetaIcon, initials: "MA", name: "Meta Ads", status: "Classificada", tone: "#1877f2", value: "Marketing \xB7 R$ 3.460" }),
  row2({ description: "Campanhas de pesquisa", icon: GoogleAdsIcon, initials: "GA", name: "Google Ads", status: "Classificada", tone: "#f4b400", value: "Marketing \xB7 R$ 2.180" }),
  row2({ description: "Licen\xE7a da plataforma de CRM", icon: HubspotIcon, initials: "HS", name: "HubSpot", status: "Classificada", tone: "#ff7a59", value: "Software \xB7 R$ 1.290" }),
  row2({ description: "Mensalidade da loja virtual", icon: ShopifyIcon, initials: "SH", name: "Shopify", status: "Classificada", tone: "#95bf47", value: "E-commerce \xB7 R$ 540" }),
  row2({ description: "Assinatura do sistema de gest\xE3o", icon: ContaAzulIcon, initials: "CA", name: "Conta Azul", status: "Classificada", tone: "#2563eb", value: "Software \xB7 R$ 410" }),
  row2({ description: "Compra de materiais de escrit\xF3rio", icon: AmazonIcon, initials: "AZ", name: "Amazon", status: "Classificada", tone: "#ff9900", value: "Materiais \xB7 R$ 860" })
];
var recentSalesRows = [
  row2({ description: "Aurora Tecnologia \xB7 Consultoria", initials: "42", name: "Venda #01942", status: "Confirmada", tone: "#2563eb", value: "R$ 12.400" }),
  row2({ description: "Lume Com\xE9rcio \xB7 Implanta\xE7\xE3o", initials: "41", name: "Venda #01941", status: "Confirmada", tone: "#0f766e", value: "R$ 8.900" }),
  row2({ description: "Studio Norte \xB7 Projeto mensal", initials: "40", name: "Venda #01940", status: "Confirmada", tone: "#7c3aed", value: "R$ 5.440" }),
  row2({ description: "Prisma Tech \xB7 Licenciamento", initials: "39", name: "Venda #01939", status: "Confirmada", tone: "#0891b2", value: "R$ 4.200" }),
  row2({ description: "Nova Oficina \xB7 Assessoria", initials: "38", name: "Venda #01938", status: "Confirmada", tone: "#d97757", value: "R$ 3.280" }),
  row2({ description: "Vitta Servi\xE7os \xB7 Treinamento", initials: "37", name: "Venda #01937", status: "Confirmada", tone: "#16845b", value: "R$ 2.170" }),
  row2({ description: "Mercado Norte \xB7 Suporte", initials: "36", name: "Venda #01936", status: "Confirmada", tone: "#475569", value: "R$ 1.580" }),
  row2({ description: "Delta Log\xEDstica \xB7 Integra\xE7\xE3o", initials: "35", name: "Venda #01935", status: "Confirmada", tone: "#ea580c", value: "R$ 2.640" })
];
var invoiceEmissionRows = [
  row2({ description: "Venda #01942 \xB7 Aurora Tecnologia", initials: "NF", name: "NFS-e #02841", status: "Emitida", tone: "#2563eb", value: "R$ 12.400" }),
  row2({ description: "Venda #01941 \xB7 Lume Com\xE9rcio", initials: "NF", name: "NFS-e #02842", status: "Emitida", tone: "#0f766e", value: "R$ 8.900" }),
  row2({ description: "Venda #01940 \xB7 Studio Norte", initials: "NF", name: "NFS-e #02843", status: "Emitida", tone: "#7c3aed", value: "R$ 5.440" }),
  row2({ description: "Venda #01939 \xB7 Prisma Tech", initials: "NF", name: "NFS-e #02844", status: "Emitida", tone: "#0891b2", value: "R$ 4.200" }),
  row2({ description: "Venda #01938 \xB7 Nova Oficina", initials: "NF", name: "NFS-e #02845", status: "Emitida", tone: "#d97757", value: "R$ 3.280" }),
  row2({ description: "Venda #01937 \xB7 Vitta Servi\xE7os", initials: "NF", name: "NFS-e #02846", status: "Emitida", tone: "#16845b", value: "R$ 2.170" }),
  row2({ description: "Venda #01936 \xB7 Mercado Norte", initials: "NF", name: "NFS-e #02847", status: "Emitida", tone: "#475569", value: "R$ 1.580" }),
  row2({ description: "Venda #01935 \xB7 Delta Log\xEDstica", initials: "NF", name: "NFS-e #02848", status: "Emitida", tone: "#ea580c", value: "R$ 2.640" })
];
var collectionRows = [
  row2({ description: "Vencimento em 04 ago", initials: "LC", name: "Lume Com\xE9rcio", status: "Cobran\xE7a enviada", tone: "#0f766e", value: "R$ 8.900" }),
  row2({ description: "Vencimento em 01 ago", initials: "NO", name: "Nova Oficina", status: "Cobran\xE7a enviada", tone: "#2563eb", value: "R$ 3.280" }),
  row2({ description: "Vencimento em 29 jul", initials: "SN", name: "Studio Norte", status: "Cobran\xE7a enviada", tone: "#7c3aed", value: "R$ 5.440" }),
  row2({ description: "Acompanhamento programado", initials: "VS", name: "Vitta Servi\xE7os", status: "Monitorando", tone: "#d97757", value: "R$ 2.170" }),
  row2({ description: "Vencimento em 25 jul", initials: "PT", name: "Prisma Tech", status: "Cobran\xE7a enviada", tone: "#0891b2", value: "R$ 1.940" }),
  row2({ description: "Acompanhamento programado", initials: "MN", name: "Mercado Norte", status: "Monitorando", tone: "#475569", value: "R$ 1.580" })
];
var fiscalRows = [
  row2({ description: "Calend\xE1rio e vencimentos", initials: "OF", name: "Obriga\xE7\xF5es fiscais", status: "Verificado", tone: "#2563eb", value: "Em dia" }),
  row2({ description: "Enquadramento atual da empresa", initials: "RT", name: "Regime tribut\xE1rio", status: "Analisado", tone: "#7c3aed", value: "Validado" }),
  row2({ description: "Cr\xE9ditos previstos na legisla\xE7\xE3o", initials: "CR", name: "Cr\xE9ditos permitidos", status: "Verificado", tone: "#16845b", value: "Dispon\xEDveis" }),
  row2({ description: "Datas e entregas dos pr\xF3ximos meses", initials: "CT", name: "Calend\xE1rio tribut\xE1rio", status: "Atualizado", tone: "#0891b2", value: "12 obriga\xE7\xF5es" }),
  row2({ description: "Cen\xE1rios do regime atual e alternativo", initials: "SC", name: "Simula\xE7\xE3o comparativa", status: "Conclu\xEDda", tone: "#475569", value: "3 cen\xE1rios" }),
  row2({ description: "Alternativa dentro da legisla\xE7\xE3o", initials: "EC", name: "Economia tribut\xE1ria", status: "Identificada", tone: "#d97757", value: "Oportunidade" })
];
function SyncScene({
  assistantText,
  duration,
  kind = "list",
  rows,
  speed = 1.8,
  subtitle,
  title
}) {
  const frame = useCurrentFrame();
  const cardFrame = Math.max(0, frame - 12) * speed;
  const cardScale = rows.length > 6 ? 0.84 : 0.92;
  const cardWidth = 940 / cardScale;
  const textIn = p3(frame, 0, 14);
  const typedCharacters = Math.floor(p3(frame, 2, 22, [0, assistantText.length]));
  const showTextCursor = frame < 26 && Math.floor(frame / 4) % 2 === 0;
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Scene, { duration, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { style: { left: "50%", position: "absolute", top: 30, transform: "translateX(-50%)", width: 940 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { style: { color: "#242424", fontSize: 18, fontWeight: 440, lineHeight: 1.4, opacity: textIn, transform: `translateY(${(1 - textIn) * 8}px)` }, children: [
      assistantText.slice(0, typedCharacters),
      showTextCursor ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { style: { borderRight: "1.5px solid #242424", marginLeft: 2 }, children: "\xA0" }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { style: { left: "50%", marginTop: 12, position: "relative", transform: `translateX(-50%) scale(${cardScale})`, transformOrigin: "top center", width: cardWidth }, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(OttoAiEmployeesSyncCard, { frame: cardFrame, kind, rows, subtitle, title }) })
  ] }) });
}
function ChartResponseScene({
  children,
  duration,
  summary,
  subtitle,
  title
}) {
  const frame = useCurrentFrame();
  const enter = p3(frame, 0, 18);
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Scene, { duration, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { style: { left: "50%", opacity: enter, position: "absolute", top: "50%", transform: `translate(-50%, -50%) translateY(${(1 - enter) * 10}px) scale(${1 + enter * 0.15})`, width: 760 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { style: { color: "#292b29", fontSize: 16, lineHeight: 1.45, margin: "0 0 22px" }, children: summary }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { style: { display: "block", fontSize: 18, fontWeight: 720, marginBottom: 8 }, children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { style: { color: MUTED2, display: "block", fontSize: 14, marginBottom: 12 }, children: subtitle }),
    children
  ] }) });
}
var cashFlowSeries = [
  { color: "#489de3", name: "Recebimentos", values: [66, 82, 93, 105, 116, 128] },
  { color: "#e97b48", name: "Pagamentos", values: [54, 62, 70, 75, 81, 88] },
  { color: "#54b77b", name: "Saldo", values: [12, 20, 23, 30, 35, 40] }
];
function cashFlowPath(values) {
  return values.map((value, index) => {
    const x = 58 + index * 132;
    const y = 210 - value / 140 * 182;
    return `${index === 0 ? "M" : "L"} ${x} ${y.toFixed(1)}`;
  }).join(" ");
}
function CashFlowChart({ duration }) {
  const frame = useCurrentFrame();
  const draw = p3(frame, 24, 94);
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
    ChartResponseScene,
    {
      duration,
      summary: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(import_jsx_runtime52.Fragment, { children: "Com base nas contas j\xE1 organizadas, a Otto projetou a evolu\xE7\xE3o do caixa para os pr\xF3ximos seis meses." }),
      subtitle: "Recebimentos, pagamentos e saldo projetado \xB7 valores em milhares de reais",
      title: "Proje\xE7\xE3o de fluxo de caixa",
      children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("svg", { height: "270", viewBox: "0 0 760 270", width: "760", children: [
        [0, 40, 80, 120].map((value) => {
          const y = 210 - value / 140 * 182;
          return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("g", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("line", { stroke: "#e7ebe9", strokeDasharray: "3 4", x1: "58", x2: "718", y1: y, y2: y }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("text", { fill: "#777b78", fontFamily: FONT3, fontSize: "11", textAnchor: "end", x: "48", y: y + 4, children: value === 0 ? "R$ 0" : `R$ ${value}k` })
          ] }, value);
        }),
        ["Ago", "Set", "Out", "Nov", "Dez", "Jan"].map((month, index) => /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("text", { fill: "#777b78", fontFamily: FONT3, fontSize: "11", textAnchor: "middle", x: 58 + index * 132, y: "235", children: month }, month)),
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("clipPath", { id: "cash-flow-draw", children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("rect", { height: "250", width: 720 * draw, x: "0", y: "0" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("g", { clipPath: "url(#cash-flow-draw)", children: cashFlowSeries.map((series) => /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("path", { d: cashFlowPath(series.values), fill: "none", stroke: series.color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" }, series.name)) }),
        cashFlowSeries.map((series, index) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("g", { opacity: p3(frame, 70 + index * 6, 88 + index * 6), transform: `translate(${220 + index * 170} 258)`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("circle", { cx: "0", cy: "-4", fill: series.color, r: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("text", { fill: "#3d403e", fontFamily: FONT3, fontSize: "12", x: "10", y: "0", children: series.name })
        ] }, series.name))
      ] })
    }
  );
}
var overdueClients = [
  { color: "#489de3", name: "Lume Com\xE9rcio", value: 8.9 },
  { color: "#6abf8a", name: "Studio Norte", value: 5.44 },
  { color: "#a587dc", name: "Nova Oficina", value: 3.28 },
  { color: "#e97b48", name: "Vitta Servi\xE7os", value: 2.17 }
];
function OverdueChart({ duration }) {
  const frame = useCurrentFrame();
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
    ChartResponseScene,
    {
      duration,
      summary: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(import_jsx_runtime52.Fragment, { children: [
        "A maior concentra\xE7\xE3o est\xE1 em dois clientes. Juntos, eles representam ",
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { children: "71% do valor em atraso" }),
        "."
      ] }),
      subtitle: "Valores vencidos por cliente \xB7 milhares de reais",
      title: "Concentra\xE7\xE3o dos recebimentos em atraso",
      children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("svg", { height: "280", viewBox: "0 0 760 280", width: "760", children: [
        [0, 2, 4, 6, 8, 10].map((value) => {
          const x = 170 + value * 52;
          return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("g", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("line", { stroke: "#e7ebe9", strokeDasharray: "3 4", x1: x, x2: x, y1: "16", y2: "230" }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("text", { fill: "#777b78", fontFamily: FONT3, fontSize: "11", textAnchor: "middle", x, y: "252", children: [
              "R$ ",
              value,
              "k"
            ] })
          ] }, value);
        }),
        overdueClients.map((client, index) => {
          const rowIn = p3(frame, 22 + index * 12, 48 + index * 12);
          const width = client.value * 52 * rowIn;
          const y = 28 + index * 52;
          return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("g", { opacity: rowIn, children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("text", { fill: "#343735", fontFamily: FONT3, fontSize: "13", fontWeight: "600", textAnchor: "end", x: "154", y: y + 18, children: client.name }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("rect", { fill: client.color, height: "28", rx: "4", width, x: "170", y }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("text", { fill: "#343735", fontFamily: FONT3, fontSize: "12", fontWeight: "700", x: 180 + width, y: y + 19, children: [
              "R$ ",
              client.value.toFixed(2).replace(".", ","),
              "k"
            ] })
          ] }, client.name);
        })
      ] })
    }
  );
}
function CompatibilityScene({ duration }) {
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Scene, { duration, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { style: { alignItems: "center", display: "flex", inset: 0, justifyContent: "center", padding: "0 80px", position: "absolute" }, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
    TypingText,
    {
      delay: 16,
      speed: duration <= 70 ? 1.4 : 0.58,
      style: { display: "block", fontSize: 64, fontWeight: 720, letterSpacing: 0, lineHeight: 1.16, maxWidth: 1e3, textAlign: "center" },
      text: "O Otto funciona diretamente no seu ChatGPT ou Claude.",
      theme: typingTheme
    }
  ) }) });
}
function OutroScene({ duration }) {
  const frame = useCurrentFrame();
  const logoIn = p3(frame, 4, 22);
  const textIn = p3(frame, 22, 40);
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Scene, { duration, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { style: { alignItems: "center", display: "flex", flexDirection: "column", inset: 0, justifyContent: "center", position: "absolute" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Img, { src: staticFile("logoOtto.svg"), style: { height: 250, opacity: logoIn, width: 590 } }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { style: { background: "#e5e7eb", height: 2, margin: "8px 0 26px", opacity: textIn, width: 120 } }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { style: { fontSize: 36, fontWeight: 600, opacity: textIn }, children: "Administre sua empresa conversando com a IA." }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { style: { alignItems: "center", color: MUTED2, display: "flex", fontSize: 18, gap: 28, marginTop: 28, opacity: p3(frame, 38, 56) }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Landmark, { size: 20 }),
        "Financeiro"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ReceiptText, { size: 20 }),
        "Fiscal"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Scale, { size: 20 }),
        "Contabilidade"
      ] })
    ] })
  ] }) });
}
function OttoFinanceAi50sVideo() {
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(AbsoluteFill, { style: { background: "#ffffff" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(OttoLogoRevealHorizontal, {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 90, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ExactPromptInputScene, { duration: 75, label: "Por onde come\xE7amos?", prompt: "Concilie as movimenta\xE7\xF5es banc\xE1rias e depois classifique as despesas." }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 165, durationInFrames: 105, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "Vou cruzar cada movimenta\xE7\xE3o banc\xE1ria com os lan\xE7amentos do Otto e confirmar as correspond\xEAncias.", duration: 105, kind: "reconciliation", rows: reconciliationRows, subtitle: "Bancos, cart\xF5es e lan\xE7amentos do Otto", title: "Concilia\xE7\xE3o banc\xE1ria" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 270, durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "Agora vou classificar cada despesa por categoria e atualizar os lan\xE7amentos correspondentes.", duration: 90, rows: expenseRows, subtitle: "Fornecedores, categorias, valores e status", title: "Classifica\xE7\xE3o de despesas" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 360, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ExactPromptInputScene, { duration: 75, label: "Por onde come\xE7amos?", prompt: "Mostre a proje\xE7\xE3o do fluxo de caixa dos pr\xF3ximos 6 meses." }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 435, durationInFrames: 105, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(CashFlowChart, { duration: 105 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 540, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ExactPromptInputScene, { duration: 75, label: "Por onde come\xE7amos?", prompt: "Emita as notas fiscais das minhas vendas recentes." }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 615, durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "Vou buscar as oito vendas mais recentes e validar clientes, servi\xE7os e valores antes da emiss\xE3o.", duration: 90, rows: recentSalesRows, speed: 2.3, subtitle: "Vendas confirmadas, clientes e valores prontos para faturar", title: "\xDAltimas 8 vendas" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 705, durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "As vendas est\xE3o validadas. Agora vou emitir as oito notas, envi\xE1-las e atualizar o financeiro.", duration: 90, rows: invoiceEmissionRows, speed: 2.3, subtitle: "Notas autorizadas, enviadas e vinculadas ao financeiro", title: "Emiss\xE3o de 8 notas fiscais" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 795, durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "Vou identificar os recebimentos vencidos, enviar as cobran\xE7as e programar os pr\xF3ximos acompanhamentos.", duration: 90, rows: collectionRows, subtitle: "Clientes em atraso e acompanhamentos autom\xE1ticos", title: "Cobran\xE7as e recebimentos" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 885, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ExactPromptInputScene, { duration: 75, label: "Por onde come\xE7amos?", prompt: "Quais clientes concentram os valores em atraso?" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 960, durationInFrames: 105, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(OverdueChart, { duration: 105 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 1065, durationInFrames: 90, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(SyncScene, { assistantText: "Vou revisar as obriga\xE7\xF5es fiscais, comparar os cen\xE1rios tribut\xE1rios e verificar oportunidades permitidas pela legisla\xE7\xE3o.", duration: 90, rows: fiscalRows, subtitle: "Obriga\xE7\xF5es, regime, cr\xE9ditos e oportunidades legais", title: "An\xE1lise fiscal e tribut\xE1ria" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 1155, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ExactPromptInputScene, { duration: 75, label: "Por onde come\xE7amos?", prompt: "Crie um dashboard com vendas, caixa, cobran\xE7as e situa\xE7\xE3o fiscal." }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 1230, durationInFrames: 135, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(OttoFinancialDashboard, {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 1365, durationInFrames: 60, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(CompatibilityScene, { duration: 60 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Sequence, { from: 1425, durationInFrames: 75, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(OutroScene, { duration: 75 }) })
  ] });
}
export {
  OTTO_FINANCE_AI_50S_DURATION,
  OttoFinanceAi50sVideo
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.development.js:
  (**
   * @license React
   * react-dom.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/arrow-up-right.js:
lucide-react/dist/esm/icons/arrow-up.js:
lucide-react/dist/esm/icons/chevron-down.js:
lucide-react/dist/esm/icons/circle-alert.js:
lucide-react/dist/esm/icons/circle-check.js:
lucide-react/dist/esm/icons/clock-3.js:
lucide-react/dist/esm/icons/landmark.js:
lucide-react/dist/esm/icons/mic.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/receipt-text.js:
lucide-react/dist/esm/icons/scale.js:
lucide-react/dist/esm/icons/trending-down.js:
lucide-react/dist/esm/icons/trending-up.js:
lucide-react/dist/esm/icons/wallet-cards.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.539.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
