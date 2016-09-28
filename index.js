import 'babel-polyfill'  // for es6 Promises and things
import runtime from 'serviceworker-webpack-plugin/lib/runtime' // Service Worker
import idb from 'idb' // indexedDB
import _ from 'lazy.js'
import __ from 'highland'
import {getStops, getStopsByStopName, insertStopsIntoDB} from './src/js/stop_repo'
import {getStopTimes, getStopTimesByTripId, getStopTimesByStopId, insertStopTimesIntoDB} from './src/js/stop-time_repo'
import './styles/materialize.css' // pull in desired CSS/SASS files


// Setup Elm
import Elm from './src/App'
var trainScheduler = Elm.App.fullscreen();

// Setup serviceWorker
registerServiceWorker();
function registerServiceWorker() {
  if (!navigator.serviceWorker) return;

  var swConfig = { scope: '/' }

  runtime.register()
}


// Don't forget to display a loader!
// TODO: Change getStops to init
trainScheduler.ports.init.subscribe(function() {
    // Fetch all our Stops
    getStops()
        .then(([_stops, fetchedFromNetwork]) => {
            // [ { stop_id: "1", name: "foo", platform_code:"NB" }
            // , { stop_id: "2", name: "foo", platform_code:"SB" }
            // ] ->
            // [ { stop_id: ["1", "2"], name: "foo" } ]
            // The assumption is that there are exactly 2 stop_ids for
            //  each stop_name. One for NB and one for SB.
            let stops = _stops.toArray()
            let mergedStopIds = []
            for(let i = 0; i < stops.length - 1; i = i + 2) {
                let curStop = stops[i]
                let nxtStop = stops[i+1]
                let stop =
                    { stop_ids: [curStop.stop_id, nxtStop.stop_id]
                    , stop_name: curStop.stop_name
                    }

                mergedStopIds.push(stop)
            }

            trainScheduler.ports.stops.send(mergedStopIds)

            if (fetchedFromNetwork) {
                insertStopsIntoDB(_stops)
            }
        })

    // Fetch all our StopTimes
    getStopTimes()
        .then(([_stopTimes, fetchedFromNetwork]) => {
            //
            console.log("_stopTimes is " + _stopTimes.size() + " elements")
            if (fetchedFromNetwork) {
                insertStopTimesIntoDB(_stopTimes)
            }
        })
})

trainScheduler.ports.computeRoute.subscribe(function(stationIds) {
    // ex: [["70012", "70013"], ["70452", "70453"]]
    //console.log(stationIds)

    let northBoundDeptStation = stationIds[0][0]
    let northBoundArrvlStation = stationIds[1][0]
    // An empty stream means that the dept station is SB of arrvl station
    let northBoundRoutes =
        computeRoute(northBoundDeptStation, northBoundArrvlStation)

    let southBoundDeptStation = stationIds[0][1]
    let southBoundArrvlStation = stationIds[1][1]
    // An empty stream means that the dept station is NB of arrvl station
    let southBoundRoutes =
        computeRoute(southBoundDeptStation, southBoundArrvlStation)

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
})

// :: (String, String) -> Stream [StopTime]
function computeRoute(deptStationId, arrvlStationId) {
    // :: Stream stationId
    return __([ deptStationId, arrvlStationId ])
        // :: Stream (Stream [tripId])
        .map(getTripIdsForStation)
        // :: Stream [tripId]
        .parallel(2)
        // :: Stream [[tripId]]
        .collect()
        .tap(console.log)
        // :: Stream tripId
        .flatMap(tripIds => __(_(tripIds[0]).intersection(tripIds[1]).toArray()))
        // :: Stream [StopTime]
        .flatMap(getStopTimesForTripId)
        // Sort the stop_times by stop_sequence
        .map(unsortedRoute =>_(unsortedRoute).sortBy('stop_sequence').toArray())
        // :: Stream [StopTime] -
        // Filter all routes where arrival station appears before dept station
        .filter(candidateRoute => {
            return deptStationId ==
                        _(candidateRoute)
                            .map(stopTime => stopTime.stop_id)
                            .dropWhile(stopId =>
                                stopId != deptStationId &&
                                stopId != arrvlStationId
                            )
                            .head()
        })
        // :: Stream [StopTime]
        // Trim our routes so that the dept station is the first station and the
        //  arrvl station is the last.
        .map(route => {
            let upToDeptStation = _(route)
                    .dropWhile(stopTime => stopTime.stop_id != deptStationId)
            let upToArrvlStation = _(route)
                    .reverse()
                    .dropWhile(stopTime => stopTime.stop_id != arrvlStationId)
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
    return __(getStopTimesByTripId().then(([_byTripId, x]) => _byTripId.get(tripId)))
}

// :: (stationId::String) -> Stream [(trip_id::String)]
function getTripIdsForStation(stationId) {
    // Get all the stop_time(s) for this station
    return __(getStopTimesByStopId()
        .then(([_byStopId, x]) => {
            // Group the stop_time(s) by trip_id and create an array of trip_ids
            return _(_byStopId.get(stationId))
                .groupBy('trip_id')
                .keys()
                .toArray()
        })
    )
}


// Autofocus on first input above fold when User navigates to a different page
trainScheduler.ports.focusOnFirstInputAboveFold.subscribe(function(unused) {
    console.log("Port called!")
    setTimeout(function() {

        var firstElement = document.querySelector('.focus-field');

        if (firstElement) {

            firstElement.focus();
        }
    }, 700);
});
