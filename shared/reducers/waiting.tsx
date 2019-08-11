import * as Constants from '../constants/waiting'
import {RPCError} from '../util/errors'
import * as Types from '../constants/types/waiting'
import * as Waiting from '../actions/waiting-gen'

// set to true to see helpful debug info
const debugWaiting = false && __DEV__

const changeHelper = (state, keys, diff, error) => {
  let newCounts = state.counts
  let newErrors = state.errors

  keys.forEach(k => {
    const oldCount = newCounts.get(k, 0)
    // going from 0 => 1, clear errors
    if (oldCount === 0 && diff === 1) {
      newErrors = newErrors.set(k, '')
    } else {
      if (error) {
        newErrors = newErrors.set(k, error)
      }
    }
    const newCount = oldCount + diff
    if (newCount === 0) {
      newCounts = newCounts.delete(k)
    } else {
      newCounts = newCounts.set(k, newCount)
    }
  })

  const newState = state.merge({counts: newCounts, errors: newErrors})
  debugWaiting && console.log('DebugWaiting:', keys, newState.toJS())
  return newState
}

const initialState: Types.State = {
  counts: new Map<string, number>(),
  errors: new Map<string, RPCError>(),
}

function reducer(state: Types.State = initialState, action: Waiting.Actions): Types.State {
  switch (action.type) {
    case 'common:resetStore': {
      // Keep the old values else the keys will be all off and confusing
      const newState = initialState.merge(state)
      debugWaiting && console.log('DebugWaiting:', '*resetStore*', newState.toJS())
      return newState
    }
    case Waiting.decrementWaiting: {
      const {key, error} = action.payload
      return changeHelper(state, typeof key === 'string' ? [key] : key, -1, error)
    }
    case Waiting.incrementWaiting: {
      const {key} = action.payload
      return changeHelper(state, typeof key === 'string' ? [key] : key, 1, '')
    }
    case Waiting.clearWaiting: {
      const {key} = action.payload
      return state.merge({
        counts: state.counts.deleteAll(typeof key === 'string' ? [key] : key),
        errors: state.errors.deleteAll(typeof key === 'string' ? [key] : key),
      })
    }
    case Waiting.batchChangeWaiting: {
      const {changes} = action.payload
      return changes.reduce((state, {key, increment, error}) => {
        return changeHelper(state, typeof key === 'string' ? [key] : key, increment ? 1 : -1, error)
      }, state)
    }
    default:
      return state
  }
}

export default reducer
