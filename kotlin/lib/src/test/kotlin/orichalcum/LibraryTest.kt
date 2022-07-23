package orichalcum

import kotlin.test.Test
import kotlin.test.assertTrue

data class IncrementViews(
    override val type: String = "INCREMENT_VIEWS"
) : Action

data class DecrementViews(
    override val type: String = "DECREMENT_VIEWS"
) : Action

data class SetMessage(
    override val type: String = "SET_MESSAGE",
    val message: String,
) : Action

data class State(
    val views: Int = 0,
    val message: String = "",
)

val reducer = { action: Action, state: State ->
    when (action) {
        is IncrementViews -> State(views = state.views + 1, message = state.message)
        is DecrementViews -> State(views = state.views - 1, message = state.message)
        is SetMessage -> State(views = state.views, message = action.message)
        else -> state
    }
}

class LibraryTest {
    @Test fun dispatchRunsReducers() {
        val store = Store<Action, State>(reducer = reducer, initialState = State())

        assertTrue(store.getState().views == 0, "views starts at 0")
        store.dispatch(IncrementViews())
        assertTrue(store.getState().views == 1, "increments views to 1")
        store.dispatch(IncrementViews())
        assertTrue(store.getState().views == 2, "increments views to 2")
        store.dispatch(DecrementViews())
        assertTrue(store.getState().views == 1, "decrements views to 1")
        store.dispatch(DecrementViews())
        assertTrue(store.getState().views == 0, "decrements views to 0")

        store.dispatch(SetMessage(message = "foobar"))
        assertTrue(store.getState().message === "foobar", "sets message")
    }
}
