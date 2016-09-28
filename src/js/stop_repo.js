import _ from 'lazy.js'
import {setupDB} from './db'
import {parseStops} from './parse'

let _stops = _()
let _byStopName = _()


// :: () -> [Stop]
export function getStops() {
    if (!_stops.isEmpty()) {
        return Promise.resolve([_stops, false])
    }

    return fetchStops()
        .then(fetchedFromNetwork => [_stops, fetchedFromNetwork])
}

// :: () -> Promise (Dict String [Stop])
export function getStopsByStopName() {
    if (!_byStopName.isEmpty()) {
        return Promise.resolve([_byStopName, false])
    } else if (!_stops.isEmpty()) {
        _byStopName = _stops.groupBy(stop => stop.stop_name)
        return Promise.resolve([_byStopName, false])
    }

    return fetchStops()
        .then(fetchedFromNetwork => {
            _byStopName = _stops.groupBy(stop => stop.stop_name)
            return Promise.resolve([_byStopName, false])
        })
}


// () -> :: Promise [Stop]
function fetchStops() {
    return downloadStops()
        .then(parseStops)
        .then(stops => [stops, true])
        .catch(err => fetchStopsFromDB().then(stops => [stops, false]))
        .then(([stops, fetchedFromNetwork]) => {
            // Ignore stops w/ no stop_code
            _stops = _(stops).filter(stop => stop.stop_id != "")
            return fetchedFromNetwork
        })
}

// :: () -> Promise String
function downloadStops() {
    return fetch(require('../../gtfs/stops.txt'))
        .then(response => response.text())
}

// :: () -> Promise [Stop]
function fetchStopsFromDB() {
    return setupDB()
        .then(db => {
            let transaction = db.transaction('stops', 'readonly')
            let store = transaction.objectStore('stops')
            return store.getAll()
        })
}

// :: [Stop] -> Promise ()
export function insertStopsIntoDB(stops) {
    return setupDB()
        .then(db => {
            let transaction = db.transaction('stops', 'readwrite')
            let store = transaction.objectStore('stops')
            stops.forEach(object => {
                store.put(object)
            })
            return Promise.resolve(transaction.complete)
        })
}
