import 'babel-polyfill'  // for es6 Promises and things
import runtime from 'serviceworker-webpack-plugin/lib/runtime' // Service Worker
import idb from 'idb' // indexedDB
import _ from 'lazy.js'
import __ from 'highland'
import './styles/materialize.css' // pull in desired CSS/SASS files


// Setup serviceWorker
registerServiceWorker();

// Setup DB
setupDB().then(db =>
    Promise.all([
        fetchAndInsertStops(db),
        fetchAndInsertStopTimes(db)]).
    then(() => Promise.resolve(db))
).then(db => {
    //
    let tx = db.transaction(['stops', 'stopTimes'], 'readwrite')
    let stopsStore = tx.objectStore('stops')
    let stopTimesStore = tx.objectStore('stopTimes')
    return Promise.all([ stopsStore.count(), stopTimesStore.count() ])
}).then(counts => {
    // TODO: How would we handle updating indexedDB?
    console.log("We have " + counts[0] + " stops and " + counts[1] + " stop times")
})


// Setup Elm
import Elm from './src/App'
var trainScheduler = Elm.App.fullscreen();

trainScheduler.ports.getStops.subscribe(function() {
    //
    setupDB()
        .then(db => {
            let tx = db.transaction(['stops'], 'readwrite')
            let store = tx.objectStore('stops')
            let index = store.index('by-stop_name')
            return store.getAll()
        })
        .then(stops => {
            // [ { stop_id: "1", name: "foo", platform_code:"NB" }
            // , { stop_id: "2", name: "foo", platform_code:"SB" }
            // ] =>
            // [ { stop_id: ["1", "2"], name: "foo" } ]
            let mergedStopIds = []
            for(let i = 0; i < stops.length; i = i + 2) {
                let curStop = stops[i]
                let nxtStop = stops[i+1]
                let stop =
                    { stop_ids: [curStop.stop_id, nxtStop.stop_id]
                    , stop_name: curStop.stop_name
                    }

                mergedStopIds.push(stop)
            }

            trainScheduler.ports.stops.send(mergedStopIds)
        })
})

trainScheduler.ports.computeRoute.subscribe(function(stationIds) {
    // ex: [["70012", "70013"], ["70452", "70453"]]
    console.log(stationIds)

    let northBoundDeptStation = stationIds[0][0]
    let northBoundArrvlStation = stationIds[1][0]
    // An empty stream means that the dept station is SOUTH of arrvl station
    let northBoundRoutes = computeRoute(northBoundDeptStation, northBoundArrvlStation)

    let southBoundDeptStation = stationIds[0][1]
    let southBoundArrvlStation = stationIds[1][1]
    // An empty stream means that the dept station is NORTH of arrvl station
    let southBoundRoutes = computeRoute(southBoundDeptStation, southBoundArrvlStation)

    // Notice that at least one of them, northBoundRoutes or southBoundRoutes,
    //  will be an empty stream.
    __([ northBoundRoutes, southBoundRoutes ])
        // Merge all our candidate routes, NB and SB, into one stream
        .merge()
        // :: Stream [StopTime]
        .take(1)
        // :: Stream [StopTime]
        .otherwise([[]])
        // :: ()
        .each(route => {
            if (route.length < 1) {
                console.log("No routes!")
            } else {
                console.log("We have a route!")
                console.log(route)
            }
            trainScheduler.ports.routes.send(route)
        })
});
// (stationId::String, arrvlStation::String) -> Stream [StopTime]
function computeRoute(deptStation, arrvlStation) {
    return __([ deptStation, arrvlStation ])
        // :: Stream (Stream [tripId])
        .map(getTripIdsForStation)
        // :: Stream [tripId]
        .parallel(2)
        // :: Stream [[tripId]]
        .collect()
        // :: Stream tripId
        .flatMap(tripIds => __(_(tripIds[0]).intersection(tripIds[1]).toArray()))
        // :: Stream [StopTime]
        .flatMap(getStopTimesForTripId)
        // Sort the stop_times by stop_sequence
        .map(unsortedRoute =>
            _(unsortedRoute).sortBy('stop_sequence').toArray()
        )
        // :: Stream [StopTime] -
        // Filter all routes where arrival station appears before dept station
        .filter(candidateRoute => {
            return deptStation ==
                        _(candidateRoute)
                            .map(stopTime => stopTime.stop_id)
                            .dropWhile(stopId =>
                                stopId != deptStation &&
                                stopId != arrvlStation
                            )
                            .head()
        })
        // :: Stream [StopTime]
        // Trim our routes so that the dept station is the first station and the
        //  arrvl station is the last.
        .map(route => {
            let upToDeptStation = _(route)
                    .dropWhile(stopTime => stopTime.stop_id != deptStation)
            let upToArrvlStation = _(route)
                    .reverse()
                    .dropWhile(stopTime => stopTime.stop_id != arrvlStation)
                    .toArray()
            // [stop1, stop2, stop3, stationIds[0], stop5, stop6, stationIds[1], stop8]
            //    Trim Stops before stationIds[0]
            //    Trim Stops after stationIds[1]
            // => [stationIds[0], stop5, stop6, stationIds[1]]
            return upToDeptStation.intersection(upToArrvlStation).toArray()
        })
}
// :: (tripId::String) -> Stream [StopTime]
function getStopTimesForTripId(tripId) {
    return __(
        setupDB().then(db => {
            let tx = db.transaction('stopTimes', 'readonly')
            let store = tx.objectStore('stopTimes')
            let index = store.index('by-trip_id')

            return index.getAll(tripId)
                })
    )
}
// :: (stationId::String) -> Stream [(trip_id::String)]
function getTripIdsForStation(stationId) {
    // Get all the stop_time(s) for this station
    return __(
        setupDB().then(db => {
        console.log("About to db transact")
        let tx = db.transaction('stopTimes', 'readonly')
        let store = tx.objectStore('stopTimes')
        let index = store.index('by-stop_id')

        return index.getAll(stationId)
    }))
    // Group the stop_time(s) by trip_id and create an array of trip_id(s)
    .map(stopTimesForStation =>
        _(stopTimesForStation)
            .groupBy('trip_id')
            .keys()
            .toArray()
    )
}


function setupDB() {
    //
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('gtfs', 1, upgradeDb => {
        var stopStore = upgradeDb.createObjectStore('stops', {
            // The keyPath should be by stop_id, since there are at least 2 stop_ids
            //  for a stop_name. One for Northbound(NB) and one for Southbound(SB)
            keyPath: 'stop_id'
        })
        stopStore.createIndex('by-stop_name', 'stop_name')

        var stopTimeStore = upgradeDb.createObjectStore('stopTimes', {
            keyPath: ['stop_id', 'trip_id']
        })
        stopTimeStore.createIndex('by-stop_id', 'stop_id')
        stopTimeStore.createIndex('trip_order', ['trip_id', 'stop_sequence'])
        stopTimeStore.createIndex('by-trip_id', 'trip_id')
    })
}

function fetchAndInsertStops(db) {
    //
    let extractValues = line => {
        let values = line.split(",")
        return {
            stop_id: values[1],     // Actually the stop_code column
            stop_name: values[2],
            platform_code: values[9]
        }
    }

    return fetch(require('./gtfs/stops.txt')).
                then(response => response.text()).
                then(text =>
                    Promise.resolve(
                        _(text).split("\n").
                            skip(1).
                            initial().
                            map(extractValues)
                    )
                ).then(stops => {
                    let transaction = db.transaction('stops', 'readwrite')
                    let store = transaction.objectStore('stops')
                    stops.forEach(object => {
                        if (object.stop_id != "")
                            store.put(object)
                    })
                    return Promise.resolve(transaction)
                }).then(transaction => transaction.complete)
}

function fetchAndInsertStopTimes(db) {
    //
    let extractValues = line => {
        let values = line.split(",")
        return {
            trip_id : values[0],
            arrival_time : values[1],
            departure_time : values[2],
            stop_id : values[3],
            stop_sequence : parseInt(values[4], 10)
        }
    }

    return fetch(require('./gtfs/stop_times.txt')).
                then(response => response.text()).
                then(text =>
                    Promise.resolve(
                        _(text).split("\n").
                            skip(1).
                            initial().
                            map(extractValues)
                    )
                ).then(stopTimes => {
                    let transaction = db.transaction('stopTimes', 'readwrite')
                    let store = transaction.objectStore('stopTimes')
                    stopTimes.forEach(object => store.put(object))
                    return Promise.resolve(transaction)
                }).then(transaction => transaction.complete)

}

function registerServiceWorker() {
  if (!navigator.serviceWorker) return;

  var swConfig = { scope: '/' }

  runtime.register()/*.then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    if (reg.waiting) {
      //indexController._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      //indexController._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      //indexController._trackInstalling(reg.installing);
    });
  });

  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
  */
}

// Autofocus when Page changes
trainScheduler.ports.focusOnFirstInputAboveFold.subscribe(function(unused) {
    console.log("Port called!")
    setTimeout(function() {

        var firstElement = document.querySelector('.focus-field');

        if (firstElement) {

            firstElement.focus();
        }
    }, 700);
});
