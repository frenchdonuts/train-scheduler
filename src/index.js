// pull in desired CSS/SASS files
require( './styles/materialize.css' );

var Elm = require('./App');
var meetupPlanner = Elm.App.fullscreen();

// Autofocus when Page changes
meetupPlanner.ports.focusOnFirstInputAboveFold.subscribe(function(unused) {
    setTimeout(function() {

        var firstElement = document.querySelector('.focus-field');

        if (firstElement) {

            firstElement.focus();
        }
    }, 500);
});
