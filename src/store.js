/**
 * Store API
 */

export const createStore = (reducer, middlewares, initialState) => {
  const actionQueue = []
  const listeners = {}
  const getNextListenerId = (() => {
    let i = 0
    return () => `listener-${i++}`
  })()
  let state = initialState
  let dispatchInProgress = false

  const alertListeners = () =>
    Object.values(listeners).forEach(listener => listener(state))

  const queueForDispatch = laterAction => {
    actionQueue.push(laterAction)
    while (actionQueue.length > 0) {
      if (!dispatchInProgress) {
        // for multiple actions, only alert listeners once
        dispatch(actionQueue.shift(), { silent: true })
        alertListeners()
      }
    }
  }

  const dispatch = (action, { silent = false } = {}) => {
    dispatchInProgress = true
    let nextAction = action
    for (let i = 0; i < middlewares.length; i++) {
      // middleware can alter the action but not state
      // middleware can dispatch additional actions
      // dispatch can be called asynchronously from middleware
      nextAction = middlewares[i](action, state, queueForDispatch)
    }
    // reducers can alter state but not the action
    // use combineReducers to supply more than one reducer
    state = reducer(action, state)
    if (!silent) {
      alertListeners()
    }
    dispatchInProgress = false
    return state
  }

  return {
    dispatch,
    getState: () => state,
    listen: fn => {
      const id = getNextListenerId()
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
