module Stop exposing (Stop, StopTime, Time, root)

import Html exposing (..)
import Html.Attributes exposing (..)


type alias Stop =
  { stop_id : String
  , stop_name : String
  }

type alias StopTime =
  { name : String
  , stop_id : Int
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

-- TODO: Move this View to a separate Card Component
root : Config -> StopTime -> Html msg
root config stop =
  div
    [ class config.gridSpec ]
    [ div
        [ class "card" ]
        [ cardContent stop ]
    ]

cardContent : StopTime -> Html msg
cardContent stopTime =
  div
    [ class "card-content" ]
    [ span [ class "card-title" ] [ text stopTime.name ]
    , p [] [ text <| "Dept. Time: " ++ ( show stopTime.departureTime ) ]
    , p [] [ text <| "Arr. Time: " ++ ( show stopTime.arrivalTime ) ]
    , p [] [ text <| "Dur: " ++ ( show stopTime.duration ) ]
    ]
