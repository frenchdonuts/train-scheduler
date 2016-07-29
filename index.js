// for es6 Promises and things
import 'babel-polyfill'
// pull in Service Worker
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
import idb from 'idb'
//import lf from 'lovefield'
import _ from 'lazy.js'
// pull in desired CSS/SASS files
import './styles/materialize.css'


// Setup serviceWorker
registerServiceWorker();
/**
var _promise = _.createWrapper(function(promise) {
    //
    //debugger
    let sequence = this;
    //debugger
    promise.then(data => {
        sequence.emit(data)
    })
});
**/
var promiseIterator = (promise) => {
    let res = undefined
    promise.then(data => res = data)

    let Iterator = () => {}
    Iterator.prototype.moveNext = () => {
        if (res == undefined) {
            return false
        } else {
            return true
        }
    }
    Iterator.prototype.current = () => {
        return res
    }
    return new Iterator()
}
var _promise = (promise) => {
    let seq = () => { this.iterator = promiseIterator(promise) }

    seq.prototype = new _.AsyncSequence()

    seq.prototype.getIterator = () => {
        return this.iterator
    }

    seq.prototype.each = () => {
        setTimeout(() => {

        })
    }
}
var pauseWhile = (pred, interval) => {
    while (pred()) {
        setTimeout(() => {}, interval)
    }
}

// Sequence (Promise a) -> AsyncSequence a
_.Sequence.define("_promise", {
  each: (fn) => {
    return this.parent.each(function(promise, i) {
        let res;
        promise.then(data => { res = data })

        pauseWhile(() => res == undefined, 0)

        return fn(res, i);
    });
  }
});
/**
_promise(
    setupDB().then(db => {
        console.log("About to db transact")
        let tx = db.transaction('stopTimes', 'readonly')
        let store = tx.objectStore('stopTimes')
        let index = store.index('by-stop_id')

        return index.getAll([ "70241" ])
    })
).map(stopTimes => { console.log(stopTimes); return stopTimes })//.flatten()
.each(stopTime => console.log("test: " + stopTime))
**/

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
        _(stopTimesForDeptStation)
            .groupBy('trip_id')
            .keys()
            // tripId -> Promise [StopTime]
            .map(tripId =>
                setupDB().then(db => {
                    //console.log("tripId: " + tripId)
                    let tx = db.transaction('stopTimes', 'readonly')
                    let store = tx.objectStore('stopTimes')
                    let index = store.index('by-trip_id')

                    return index.getAll([ tripId ])
                })
            )
            // Sequence (Promise [StopTime]) -> Sequence (FlattenedSequence StopTime)
            // I want: Sequence (Promise [StopTime]) -> AsyncSequence [StopTime]
            //  _promise(promise) :: Sequence (StreamLikeSequence [StopTime])
            //.map(promise => _promise(promise).map(stopTimes => _(stopTimes).sortBy('stop_sequence')).flatten())
            // The problem right now is that the "outside" Sequence is SYNCHRONOUS while the "inside" Sequence
            //   is ASYNCHRONOUS.
            // How can we make the outside Sequence ASYNCHRONOUS?
            // Can we make the inside Sequence SYNCHRONOUS?
            //   Well...if I (flatten -> groupBy -> keys), then the outside will by async while the inside
            //     will be synchronous (arrays)
            //   ^ Won't work. groupBy doesn't seem to work w/ asynchronous sequences
            ._promise()
            .tap(stopTimes => console.log(stopTimes))
            .filter(candidateRoute => {
                let stopIds = candidateRoute.map(stopTime => stopTime.stop_id)
                let ans = stopIds
                            .dropWhile(stopId => (stopId != stationIds[0] && stopId != stationIds[1]))
                            //.tap(stopId => console.log(stopId))
                            // Why is ans undefined even though we successfully log 70241 using tap?
                            // B/C IT'S ASYNC!
                            //.first()

                let result;
                ans.each(function(e) {
                    result = e;
                    console.log(result)
                    return false;
                });
                            //.onComplete((stopId) => console.log(stopId))
                            //.getIterator()
                            //.moveNext()
                            //.current()
                console.log(result)//.moveNext())
                // WHY DOES THIS RETURN -1 ?!? Oh...b/c it's a STREAM-LIKE SEQUENCE
                //console.log(ans.current())
                //console.log(stopIds.indexOf(stationIds[1]))
                //console.log(stopIds.indexOf(stationIds[0]) < stopIds.indexOf(stationIds[1]))
                return result == stationIds[0] //topIds.indexOf(stationIds[0]) < stopIds.indexOf(stationIds[1])
                /**
                console.log(candidateRoute.toArray())
                //candidateRoute.reduce((acc, x) => {}, false)
                for (let stopTime of candidateRoute.toArray()) {
                    // stationIds[0] occurs before stationIds[1]
                    if (stopTime.stop_id === stationIds[0])
                        return true
                    // stationIds[1] occurs before stationIds[0]
                    else if (stopTime.stop_id === stationIds[1])
                        return false
                }
                // Shouldn't happen
                return false
                **/
            })
            .map(route => {
                console.log(route)
                return route
                // Trim Stops before stationIds[0]
                // Trim Stops after stationIds[1]
            })
            .take(1)
            .each(route => {
                console.log(route)
                //trainScheduler.ports.routes.send(route)
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
