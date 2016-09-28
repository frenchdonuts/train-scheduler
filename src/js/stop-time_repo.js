import _ from 'lazy.js'
import {setupDB} from './db'
import {parseStopTimes} from './parse'

let _stopTimes = _()
let _byStopId = _()
let _byTripId = _()


// :: () -> ([StopTime], Bool)
export function getStopTimes() {
    //
    if (!_stopTimes.isEmpty()) {
        return Promise.resolve([_stopTimes, false])
    }

    return fetchStopTimes
        .then(fetchedFromNetwork => [_stopTimes, fetchedFromNetwork])
}

// :: () -> Promise ((Dict String [StopTime]), Bool)
export function getStopTimesByStopId() {
    //
    if (!_byStopId.isEmpty()) {
        return Promise.resolve([_byStopId, false])
    } else if (!_stopTimes.isEmpty()) {
        _byStopId = _stopTimes.groupBy("stop_id")
        return Promise.resolve([_byStopId, false])
    }

    return fetchStopTimes
        .then(fetchedFromNetwork => {
            _byStopId = _stopTimes.groupBy("stop_id")
            return Promise.resolve([_byStopId, fetchedFromNetwork])
        })
}

// :: () -> Promise ((Dict String [StopTime]), Bool)
export function getStopTimesByTripId() {
    //
    if (!_byTripId.isEmpty()) {
        return Promise.resolve([_byTripId, false])
    } else if (!_stopTimes.isEmpty()) {
        _byTripId = _stopTimes.groupBy(stopTime => stopTime.trip_id)
        return Promise.resolve([_byTripId, false])
    }

    return fetchStopTimes
        .then(fetchedFromNetwork => {
            _byTripId = _stopTimes.groupBy(stopTime => stopTime.trip_id)
            return Promise.resolve([_byTripId, fetchedFromNetwork])
        })
}

// :: Promise String
const downloadStopTimes = fetch(require('../../gtfs/stop_times.txt'))
    .then(response => response.text())

// :: Promise ([StopTime], Bool)
const fetchStopTimes = downloadStopTimes
    .then(parseStopTimes)
    .then(stopTimes => [stopTimes, true])
    .catch(err => fetchStopTimesFromDB.then(stopTimes => [stopTimes, false]))
    .then(([stopTimes, fetchedFromNetwork]) => {
        _stopTimes = _(stopTimes)
        return fetchedFromNetwork
    })

// :: Promise [StopTime]
const fetchStopTimesFromDB = setupDB()
    .then(db => {
        let transaction = db.transaction('stopTimes', 'readonly')
        let store = transaction.objectStore('stopTimes')
        return store.getAll()
    })

// :: [Stop] -> Promise ()
export function insertStopTimesIntoDB(stopTimes) {
    return setupDB()
        .then(db => {
            let transaction = db.transaction('stopTimes', 'readwrite')
            let store = transaction.objectStore('stopTimes')
            stopTimes.forEach(object => {
                store.put(object)
            })
            return Promise.resolve(transaction.complete)
        })
}
