export const genID = () => `id:${Math.random().toString(36).substr(2)}`

/*
 * createStore(
 *   (action, state) => state, // combineReducers(...fns)
 *   (action, state, dispatch) => action, // combineMiddleware(...fns)
 *   initialState,
 * ) --> {
 *   dispatch: action => void,
 *   getState: () => state,
 *   listen: (state => void) => removeListener,
 * }
 */
export const createStore = (reducer, middleware, state) => {
  const actionQueue = []
  const listeners = {}
  let dispatchInProgress = false

  const queueForDispatch = (...actions) => {
    actionQueue.push(...actions)
    if (!dispatchInProgress) {
      dispatchFromQueue()
    }
  }

  const dispatchFromQueue = () => {
    dispatchInProgress = true
    const prevState = state
    while (typeof actionQueue[0] !== 'undefined') {
      dispatch(actionQueue.shift())
    }
    alertListeners(state, prevState)
    dispatchInProgress = false
  }

  const dispatch = action => {
    // middleware can alter the action but not state
    // middleware can dispatch additional actions
    // dispatch can be called asynchronously from middleware
    // use combineMiddleware to use more than one layer
    action = middleware(action, state, queueForDispatch)

    // reducers can alter state but not the action
    // use combineReducers to supply more than one reducer
    state = reducer(action, state)
  }

  const attachListener = fn => {
    const id = genID()
    listeners[id] = fn
    return () => {
      delete listeners[id]
    }
  }

  const alertListeners = () =>
    Object.values(listeners).forEach(listener => listener(state))

  return {
    dispatch: queueForDispatch,
    getState: () => state,
    listen: attachListener,
  }
}

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
 * Use `applyEffects` to pass an object mapping action types to middleware
 * functions, eg:
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

