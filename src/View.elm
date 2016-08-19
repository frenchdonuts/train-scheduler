module View exposing (root)

{-| This module's sole purpose is to render the State as defined in Types and
map User inputs to Operations as defined in Types
-}
import Types exposing (..)
import Autocomplete.View as Autocomplete
import Stop exposing (root)
import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Debug

root : Model -> Html Msg
root m =
  let
    gridSpec = "col s12 m6 l6"

    -- TODO: import Stop.Stops
    stops =
      []

    deptConfig =
      { label' = Just "Departure"
      , placeholder' = Nothing
      , classes = gridSpec
      , autofocus = True
      , toString = \stop -> stop.name
      }

    arrivalConfig =
      { label' = Just "Arrival"
      , placeholder' = Nothing
      , classes = gridSpec
      , autofocus = False
      , toString = \stop -> stop.name
      }

    cardConfig =
      { gridSpec = "col s12 m8 offset-m2" }

    temp = m.route --Debug.log "List of Stops" m.route
  in
    div
      [ class "container" ]
      [ div
          [ class "row" ]
          [ Html.App.map DepartureInput ( Autocomplete.root deptConfig m.departureStop stops )
          , Html.App.map ArrivalInput ( Autocomplete.root arrivalConfig m.arrivalStop stops )
          ]
        , div
            [ class "row" ]
            [ a
              [ class "waves-effect waves-light btn col s12 m2 offset-m10"
              , onClick <| FetchRoute "70241" "70121"
              ]
              [ text "Search" ]
            ]
        , div [ class "row" ] (List.map (Stop.root cardConfig) m.route)
      ]
