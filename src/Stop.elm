module Stop exposing (Stop, Time, root)

import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)


type alias Stop =
  { name : String
  , id : Int
  , duration : Time
  , departureTime : Time
  , arrivalTime : Time
  }

type alias Time =
  { hr : Int
  , min : Int
  , sec : Int
  }
show : Time -> String
show time = ( toString time.hr ) ++ ":" ++ ( toString time.min ) ++ ":" ++ ( toString time.sec )

-- TODO: Make List Stop from parsing GTFS

type alias Config =
  { gridSpec : String }

root : Config -> Stop -> Html msg
root config stop =
  div
    [ class config.gridSpec ]
    [ div
        [ class "card" ]
        [ cardContent stop ]
    ]

cardContent : Stop -> Html msg
cardContent stop =
  div
    [ class "card-content" ]
    [ span [ class "card-title" ] [ text stop.name ]
    , p [] [ text <| "Dept. Time: " ++ ( show stop.departureTime ) ]
    , p [] [ text <| "Arr. Time: " ++ ( show stop.arrivalTime ) ]
    , p [] [ text <| "Dur: " ++ ( show stop.duration ) ]
    ]
