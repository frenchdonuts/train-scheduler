// for es6 Promises and things
import 'babel-polyfill'
// pull in Service Worker
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
import idb from 'idb'
//import lf from 'lovefield'
import _ from 'lazy.js'
import Bacon from 'highland'
// pull in desired CSS/SASS files
import './styles/materialize.css'


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
    // TODO: Let's see if the count changes if:
    // 1) We 'put' the same gtfs files - NO they don't. Good thing too.
    // 2) 'put' different gtfs files - What we want is an overwrite of stop times, so hopefully NO.
    console.log("We have " + counts[0] + " stops and " + counts[1] + " stop times")
})


// Setup Elm
import Elm from './src/App'
var trainScheduler = Elm.App.fullscreen();

trainScheduler.ports.computeRoute.subscribe(function(stationIds) {
    console.log(stationIds)
    // What happens if DB Setup hasn't finished running yet?
    // Hopefully, the query interface gives us a promise...
    // We can try queuing this query. Run at a later time.
    // Return []?
    setupDB().then(db => {
        console.log("About to db transact")
        let tx = db.transaction('stopTimes', 'readonly')
        let store = tx.objectStore('stopTimes')
        let index = store.index('by-stop_id')

        return index.getAll([ stationIds[0] ])
    })
    .then(stopTimesForDeptStation => {
        //
        console.log("Start of route computation")
        // :: Stream TripId
        Bacon(
            _(stopTimesForDeptStation)
                .groupBy('trip_id')
                .keys()
                .toArray()
            )
            // Stream [StopTime]
            .flatMap(tripId =>
                Bacon(
                    setupDB().then(db => {
                        //console.log("tripId: " + tripId)
                        let tx = db.transaction('stopTimes', 'readonly')
                        let store = tx.objectStore('stopTimes')
                        let index = store.index('by-trip_id')

                        return index.getAll([ tripId ])
                    })
                )
            )
            //.tap(stopTimes => console.log(stopTimes))
            // :: Stream [StopTime]
            .map(unsortedRoute => _(unsortedRoute).sortBy('stop_sequence').toArray())
            // :: Stream [StopTime]
            .filter(candidateRoute => {
                return stationIds[0] ==
                            _(candidateRoute)
                                .map(stopTime => stopTime.stop_id)
                                .dropWhile(stopId => (stopId != stationIds[0] && stopId != stationIds[1]))
                                .head()
            })
            // :: Stream [StopTime]
            .map(route => {
                let upToStationIds0 = _(route).dropWhile(stopTime => stopTime.stop_id != stationIds[0])
                let upToStationIds1 = _(route)
                                        .reverse()
                                        .dropWhile(stopTime => stopTime.stop_id != stationIds[1])
                                        .toArray()
                // [stop1, stop2, stop3, stationIds[0], stop5, stop6, stationIds[1], stop8]
                // Trim Stops before stationIds[0]
                // Trim Stops after stationIds[1]
                // [stationIds[0], stop5, stop6, stationIds[1]]
                return upToStationIds0.intersection(upToStationIds1).toArray()
            })
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
                    //trainScheduler.ports.routes.send(route)
                }
            })
    })
});


function setupDB() {
    //
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('gtfs', 1, upgradeDb => {
        var stopStore = upgradeDb.createObjectStore('stops', {
            keyPath: 'stop_id'
        })
        stopStore.createIndex('name', 'stop_name')

        var stopTimeStore = upgradeDb.createObjectStore('stopTimes', {
            keyPath: ['stop_id', 'trip_id']
        })
        stopTimeStore.createIndex('trip_order', ['trip_id', 'stop_sequence'])
        stopTimeStore.createIndex('by-trip_id', 'trip_id')
        // Can I create an index that gives me the trip_ids given a stop_id?
    })
}

function fetchAndInsertStops(db) {
    //
    let extractValues = line => {
        let values = line.split(",")
        return {
            stop_id: values[0],
            stop_name: values[2]
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
                    stops.forEach(object => store.put(object))
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
