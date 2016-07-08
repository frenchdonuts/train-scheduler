// for es6 Promises and things
import 'babel-polyfill'
// pull in Service Worker
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
// pull in desired CSS/SASS files
import './styles/materialize.css'

// Setup serviceWorker
registerServiceWorker();

// Setup Elm
import Elm from './src/App'
var trainScheduler = Elm.App.fullscreen();

trainScheduler.ports.computeRoute.subscribe(function(stationIds) {
    // Send a fake List Stop for now.

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
