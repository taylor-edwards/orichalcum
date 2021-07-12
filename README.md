# Orichalcum

Orichalcum provides a Redux-inspired store designed around discrete state
transitions with message passing and immutable data structures.
 
## Initial state

The initial state should be a minimal representation of your app as it needs
to be set at startup time. This could be anything from a JSON object to a
Boolean or any supplied variable.

A common usage is to provide a serializable object (you can test for this with
`JSON.stringify`), like in this example:

```javascript
const initialState = {
  todoList: [],
}
```

## Reducers

Reducers are used to make structured updates to your app's state (see #Initial
state above). They take the current application state and return a copy of it
with any changes applied. It's important to reuse object references as much as
possible to effectively control memory usage and enable efficient equality
checks, which is why these examples use the spread operator (`...`) judiciously
(it also helps later when extending "state" to include additional properties).

```javascript
const reducer = (_, state) => {
  // `state` is the same as `initialState` until we return something different:
  // state = {
  //   todoList: [],
  // }

  // update state by modifying the return value:
  const myTodo = {
    name: 'Buy milk',
    completed: false,
  }
  return {
    ...state,
    todoList: state.todoList.concat([myTodo]),
  }
}
```

When it comes to testing, it's important that the tests and results are fully
deterministic. That means we want each reducer to always return the same value,
so we should never find ourselves calling `Math.random`, constructing dates or
using otherwise unpredictable values within in reducers. For passing contextual
data to a reducer we can use "actions."

## Actions

The above example works, but it relies on hardcoded variables. In order to pass
data to the reducers, we'll use an `action`. Any object with a `type: String`
property can be considered an action, so here we'll rewrite the above example
but we'll pass the newly created "todo" as a variable instead of hardcoding it:

```javascript
const action = {
  type: 'CREATE_TODO',
  todo: {
    name: 'Buy milk',
    completed: false,
  },
}

const reducer = (action, state) => {
  if (action.type === 'CREATE_TODO') {
    return {
      ...state,
      todoList: state.todoList.concat([action.todo]),
    }
  }
}
```

Great, so we can separate our state transitions from our data source, but how
do we connect them? Let's look at how we can pass actions to our store using
the `dispatch` method.

## Dispatch

In order to initiate a state transition, we'll dispatch an action to our store:

```javascript
// See the examples above for the `initialState` and `reducer` values.
// We're passing `undefined` because our store doesn't have middleware yet
const store = createStore(reducer, undefined, initialState)

store.dispatch({
  type: 'CREATE_TODO',
  todo: {
    name: 'Buy milk',
    completed: false,
  },
})

// check that our new "todo" was added to the list:
store.getState(state => {
  // state = {
  //   todoList: [
  //     { name: 'Buy milk', completed: false },
  //   ],
  // }
  console.assert(state.todoList[0].name === 'Buy milk')
})
```

## Middleware

We can integrate external APIs consistently through the use of "middleware."
This can help us manage asynchronous function calls like making a network
request and updating a value when it resolves, or modifying `action` objects
before they are passed to reducers.

Co-locating all of your third-party integration into middleware also means
components that call `store.dispatch` don't have to know which (if any) APIs
are involved in a given feature and can restrict their concerns to only passing
the correct data to the store (structured as an action).

In this example, we'll make a variant on the "todo" store from above and
pretend we have to sync our list with a server. We can extend this with
the reducers from above to enable adding, editing and removing todos, but
we would need to make sure to add the corresponding API calls to the
middleware layer as well.

It's generally helpful to use two or more actions when working with
asynchronous functions. In this example, we'll separate the initial "request"
to fetch our todo list from the actual result that eventually sets it. Doing
this makes it easier to display loading states and keep track of what's
in-flight at any given moment, too.

```javascript
const initialState = {
  todoList: [],
  loading: false,
  lastLoadedTimestamp: null,
  err: null,
}

const reducer = (action, state) => {
  switch (action.type) {
    case 'FETCH_TODOS':
      return {
        ...state,
        loading: true,
      }

    case 'SET_TODOS':
      return {
        ...state,
        loading: false,
        todoList: action.todoList,
        lastLoadedTimestamp: action.timestamp,
      } 

    case 'TODOS_ERROR':
      return {
        ...state,
        loading: false,
        err: action.err,
      }

    default:
      return state
  }
}

const middleware = (action, state, dispatch) => {
  if (action.type === 'FETCH_TODOS' && !state.loading) {
    // some HTTP request that returns a JSON list of "todos"
    fetchTodos()
      .then(todoList => dispatch({
        todoList,
        timestamp: Date.now(),
        type: 'SET_TODOS',
      })
      .catch(err => dispatch({
        err: err.message,
        type: 'TODOS_ERROR',
      }))
  }
  return action
}

const asyncTodoStore = createStore(reducer, middleware, initialState)
asyncTodoStore.dispatch({ type: 'FETCH_TODOS' })
// synchronously updates state to set `loading: true` while kicking off a
// network request in the middleware that will eventually set the todo list
// value or set an error message
```

## Listening for state transitions

For each action that is dispatched to the store, all attached listeners will
be alerted regardless of whether there was a change. The return value for
calling `listen` is a canceler function that will detach that listener from
the store when called.

```javascript
const logger = (state, prevState, action) => {
  console.log('Received event!', { action })
}

// define a store with any number of reducers and middleware:
const store = createStore(...)

// attach our listener and store its canceler function:
const removeLogger = store.listen(logger)

// the logger will run once for each action we pass to dispatch:
store.dispatch({ type: 'SOME_ACTION' })
// logs { action: { type: 'SOME_ACTION' }
store.dispatch(
  { type: 'ANOTHER_ACTION', foo: 'foo value' },
  { type: 'SUCH_WOW', o: 'rly },
)
// first logs { action: { type: 'ANOTHER_ACTION', foo: 'foo value' } }
// then ALSO logs { action: { type: 'SUCH_WOW', o: 'rly' } } 

// call the canceler function when we want to stop logging events:
removeLogger()
store.dispatch({ type: 'SOME_ACTION' })
// no longer logs anything
```
