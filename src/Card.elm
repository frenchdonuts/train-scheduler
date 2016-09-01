module Card exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)


type State
  = Stop
      { name : String
      , deptTime : String
      , arrvlTime : String
      }
  | Duration String

stop :
      { name : String
      , deptTime : String
      , arrvlTime : String
      }
      -> State
stop { name, deptTime, arrvlTime } =
  Stop
    { name = name
    , deptTime = deptTime
    , arrvlTime = arrvlTime
    }

duration : String -> State
duration duration =
  Duration duration


type alias Config =
  { gridSpec : String }


root : Config -> State -> Html msg
root config state =
  div
    [ class config.gridSpec ]
    [ div
        [ class "card" ]
        [ card state ]
    ]

card : State -> Html msg
card state =
  case state of
    Stop stop ->
      stopCard stop

    Duration duration ->
      durationCard duration

stopCard : { name:String, deptTime:String, arrvlTime:String } -> Html msg
stopCard { name, deptTime, arrvlTime } =
  div
    [ class "card-content" ]
    [ span [ class "card-title" ] [ text name ]
    , p [] [ text <| "Dept. Time: " ++ ( deptTime ) ]
    , p [] [ text <| "Arr. Time: " ++ ( arrvlTime ) ]
    ]

durationCard : String -> Html msg
durationCard duration =
  div
    [ class "card-content" ]
    [ span [ class "card-title" ] [ text duration ] ]
