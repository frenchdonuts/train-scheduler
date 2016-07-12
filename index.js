// for es6 Promises and things
import 'babel-polyfill'
// pull in Service Worker
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
import idb from 'idb'
//import lf from 'lovefield'
import Lazy from 'lazy.js'
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
    // What happens if DB Setup hasn't finished running yet?
    // Hopefully, the query interface gives us a promise...
    // We can try queuing this query. Run at a later time.
    // Return []?

    var route = [
        { name : "Berney St"
        , id : 1234
        , duration : { hr : 2, min : 1, sec : 0 }
        , departureTime : { hr : 3, min : 0, sec : 0}
        , arrivalTime : { hr : 4, min : 30, sec : 59 }
        }
     ]
    console.log("route stops: " + route.toString())

    trainScheduler.ports.routes.send(route)
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
                        Lazy(text).split("\n").
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
                        Lazy(text).split("\n").
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
