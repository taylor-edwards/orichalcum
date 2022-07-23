/**
 * Each reducer must have the signature `(action, state) => state`
 * Reducers are expected to return the original state or a modified copy
 */
export const combineReducers =
  (...reducers) =>
  (action, state) => {
    for (const reducer of reducers) {
      state = reducer(action, state)
    }
    return state
  }

/**
 * Use `applyReducers` to pass an object mapping action types to reducers, eg:
 * ```
 * const myReducers = applyReducers({
 *   MY_ACTION_TYPE: (action, state) => doSomething(state),
 * })
 * ```
 */
export const applyReducers =
  (reducerMap, initialState) =>
  (action, state = initialState) => {
    if (reducerMap.hasOwnProperty(action.type)) {
      return reducerMap[action.type](action, state)
    }
    return state
  }

/**
 * Each middleware must have the signature `(action, state, dispatch) => action`
 * Middleware are expected to return the original or modified action
 */
export const combineMiddleware =
  (...middlewares) =>
  (action, state, dispatch) => {
    for (const middleware of middlewares) {
      action = middleware(action, state, dispatch)
    }
    return action
  }

/**
 * Use `applyEffects` to pass an object mapping action types to middleware, eg:
 * ```
 * const myMiddleware = applyEffects({
 *   MY_ACTION_TYPE: (action, state, dispatch) => doSomething(action),
 * })
 * ```
 */
export const applyEffects = effectMap => (action, state, dispatch) => {
  if (effectMap.hasOwnProperty(action.type)) {
    return effectMap[action.type](action, state, dispatch)
  }
  return action
}

/**
 * Use `once` to create a self-cancelling listener. When the predicate function
 * returns `true`, the returned promise will resolve.
 *
 * Pass `{ timeout: 0 }` in the options object to disable the timeout.
 * ```
 * const [promise, cancelPromise] = once(
 *   Listener: (state, prevState, action) => Boolean,
 *   Store,
 *   Options: { timeout }
 * )
 * promise.then(onSuccess, onError)
 * ```
 */
export const once = (pred, store, { timeout = 300 } = {}) => {
  let resolve, reject, timer
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  const removeListener = store.listen((...x) => {
    if (pred(...x)) {
      clearTimeout(timer)
      removeListener()
      resolve()
    }
  })
  if (timeout !== 0) {
    timer = setTimeout(() => {
      removeListener()
      reject(new Error(`once listener timed out (waited ${timeout} ms)`))
    }, timeout)
  }
  const cancel = () => {
    removeListener()
    clearTimeout(timer)
    reject(new Error('once listener canceled'))
  }
  return [promise, cancel]
}
