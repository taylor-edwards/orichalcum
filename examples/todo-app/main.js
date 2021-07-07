import {
  applyEffects,
  applyReducers,
  combineMiddleware,
  createStore,
  genID,
} from '../../src/store.js'
import {
  assoc,
  compose,
  curry,
  filter,
  keys,
  lensPath,
  lensProp,
  mergeDeepLeft,
  omit,
  over,
  pick,
  view,
} from 'ramda'

// Define app state and codify allowed mutations:

const appInitialState = {
  todoList: {},
}

const todoInitialState = {
  id: undefined,
  message: '',
  completed: false,
}

const todoListLens = lensProp('todoList')

const todoLens = id => lensPath(['todoList', id])

const setTodo = curry((id, todo, state) =>
  over(
    todoLens(id),
    (prevTodo = todoInitialState) =>
      mergeDeepLeft(
        compose(
          assoc('id', id),
          filter(propValue => typeof propValue !== 'undefined'),
          pick(keys(todoInitialState)),
        )(todo),
        prevTodo,
      ),
    state,
  ),
)

const deleteTodo = curry((id, state) => over(todoListLens, omit([id]), state))

// Create a store with predefined "actions" for performing updates and
// middleware for further integrations:

const actions = {
  ADD_TODO: 'ADD_TODO',
  REMOVE_TODO: 'REMOVE_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
}

const appReducer = applyReducers(
  {
    [actions.ADD_TODO]: ({ id, todo }, state) => setTodo(id, todo, state),
    [actions.UPDATE_TODO]: ({ id, todo }, state) => setTodo(id, todo, state),
    [actions.REMOVE_TODO]: ({ id }, state) => deleteTodo(id, state),
  },
  appInitialState,
)

const effectsMiddleware = applyEffects({
  [actions.ADD_TODO]: action => assoc('id', genID(), action),
})

const loggerMiddleware = (action, state, dispatch) => {
  // console.log('consuming action:', action)
  return action
}

// Expose the app's store interface (contains methods `dispatch`, `getState`,
// and `listen`):

export const todoStore = createStore(
  appReducer,
  combineMiddleware(effectsMiddleware, loggerMiddleware),
  appInitialState,
)

// Expose methods for querying state from `getState`:

export const selectTodoList = view(todoListLens)

export const selectTodoIDList = compose(keys, selectTodoList)

export const selectTodo = curry((id, state) => view(todoLens(id), state))

// Expose action creators for calls to `dispatch`:

export const addTodo = (message, completed = false) => ({
  todo: {
    completed,
    message,
  },
  type: actions.ADD_TODO,
})

export const updateTodo = (id, todo) => ({
  id,
  todo,
  type: actions.UPDATE_TODO,
})

export const removeTodo = id => ({
  id,
  type: actions.REMOVE_TODO,
})
