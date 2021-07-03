const genID = (() => {
  let i = 0
  return () => `id:${(i++).toString(36).padStart(8, 0)}`
})()

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
    while (typeof actionQueue[0] !== 'undefined') {
      dispatch(actionQueue.shift())
    }
    dispatchInProgress = false
    alertListeners()
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

export const combineReducers =
  (...reducers) =>
  (action, state) => {
    for (const reducer in reducers) {
      state = reducer(action, state)
    }
    return state
  }

export const combineMiddleware =
  (...middlewares) =>
  (action, state, dispatch) => {
    for (const middleware in middlewares) {
      action = middleware(action, state, dispatch)
    }
    return action
  }
