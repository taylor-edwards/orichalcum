/**
 * Store API
 */

const genID = (() => {
  let i = 0
  return () => `id${(i++).toString(36).padStart(8, 0)}`
})()

export const createStore = (reducer, middleware, state) => {
  const actionQueue = []
  const listeners = {}
  let dispatchInProgress = false

  const alertListeners = () =>
    Object.values(listeners).forEach(listener => listener(state))

  const queueForDispatch = laterAction => {
    actionQueue.push(laterAction)
    while (actionQueue.length > 0) {
      if (!dispatchInProgress) {
        dispatch(actionQueue.shift())
      }
    }
  }

  const dispatch = (action, options = { silent: false }) => {
    if (dispatchInProgress) {
      queueForDispatch(action)
      return
    }

    dispatchInProgress = true

    // middleware can alter the action but not state
    // middleware can dispatch additional actions
    // dispatch can be called asynchronously from middleware
    // use combineMiddleware to use more than one layer
    action = middleware(action, state, queueForDispatch) ?? action

    // reducers can alter state but not the action
    // use combineReducers to supply more than one reducer
    state = reducer(action, state)

    if (!options.silent) {
      alertListeners()
    }

    dispatchInProgress = false
  }

  return {
    dispatch,
    getState: () => state,
    listen: fn => {
      const id = genID()
      listeners[id] = fn
      return () => {
        delete listeners[id]
      }
    },
  }
}

export const combineReducers =
  (...reducers) =>
  (action, state) => {
    for (let i = 0; i < reducers.length; i++) {
      state = reducers[i](action, state)
    }
    return state
  }

export const combineMiddleware =
  (...middleware) =>
  (action, state, dispatch) => {
    for (let i = 0; i < middleware.length; i++) {
      action = middleware[i](action, state, dispatch) ?? action
    }
    return action
  }
