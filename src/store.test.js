import { createStore, combineReducers } from './store.js'
import { identity, is, equals } from './util.js'

// Enumerate changes to state as "actions"
// This also helps with serialization, in case actions need to go through
// some additional cache or network layers before reaching the store
const ACTIONS = {
  DELAY_FOO: 'DELAY_FOO',
  FLIP_BITS: 'FLIP_BITS',
  SET_FOO: 'SET_FOO',
}

// Use reducers to progress application state without mutations
const myReducer = (action, state) => {
  switch (action.type) {
    case ACTIONS.FLIP_BITS:
      return {
        ...state,
        all_my_bits: {
          ...state.all_my_bits,
          just_one_piece: !state.all_my_bits.just_one_piece,
        },
      }
    case ACTIONS.SET_FOO:
      return {
        ...state,
        foo: action.value,
      }
    default:
      return state
  }
}

// Use middleware to manage side effects and asynchronous functionality
const myMiddleware = (action, state, dispatch) => {
  switch (action.type) {
    case ACTIONS.DELAY_FOO:
      setTimeout(
        () => dispatch({ type: ACTIONS.SET_FOO, value: 'time is no matter!' }),
        3000,
      )
      break

    case ACTIONS.SET_FOO:
      action.value = 'overridden by mw'
      break
  }
  return action
}

// State is just data! Use structures that make sense in your application
const initialState = {
  foo: 'bar',
  all_my_bits: {
    unused_state: 42,
    just_one_piece: true,
  },
}

/**
 * Demonstration: putting a finite-state machine into use
 */
export const testStore = assert => {
  const store = createStore(myReducer, myMiddleware, initialState)
  assert(is, store.getState(), initialState)

  // store.dispatch({ type: ACTIONS.DELAY_FOO })
  // assert(is, initialState, store.getState())

  store.dispatch({ type: ACTIONS.FLIP_BITS })
  assert(equals, false, store.getState().all_my_bits.just_one_piece)

  store.dispatch({ type: ACTIONS.SET_FOO, value: 'choco yoohoo' })
  assert(equals, 'overridden by mw', store.getState().foo)
}
