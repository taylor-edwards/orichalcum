/*
 * createStore(
 *   (action, state) => state,            // combineReducers(...fns)
 *   (action, state, dispatch) => action, // combineMiddleware(...fns)
 *   initialState,                        // { myValue: 'Hello, world!' }
 * ) --> {
 *   dispatch: action => void,
 *   getState: () => state,
 *   listen: (state => void) => fn removeListener,
 * }
 */
export const createStore = (
  reducer = (action, state) => state,
  middleware = (action, state, dispatch) => action,
  initialState,
) => {
  const queue = []
  const listeners = {}
  let listenersCreated = 0
  let dispatchInProgress = false
  let state = initialState

  const dispatch = (...actions) => {
    queue.push(...actions)
    dispatchFromQueue()
  }

  const dispatchFromQueue = () => {
    if (!dispatchInProgress) {
      dispatchInProgress = true
      let action
      while ((action = queue.shift())) {
        action = middleware(action, state, dispatch) ?? action
        const prevState = state
        state = reducer(action, state)
        Object.values(listeners).forEach(listener =>
          listener(state, prevState, action),
        )
      }
      dispatchInProgress = false
    }
  }

  return {
    dispatch,
    getState: () => state,
    listen: fn => {
      listenersCreated += 1
      const id = listenersCreated
      listeners[id] = fn
      return () => {
        delete listeners[id]
      }
    },
  }
}
