module View exposing (root)

{-| This module's sole purpose is to render the State as defined in Types and
map User inputs to Operations as defined in Types
-}
import Types exposing (..)
--import Autocomplete.View as Autocomplete
import DebouncedAutocomplete exposing (root)
import Card exposing (root)
import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)
import Html.Events exposing (..)
--import Debug

root : Model -> Html Msg
root m =
  let
    gridSpec = "col s12 m6 l6"

    stops =
      m.stops

    deptConfig =
      DebouncedAutocomplete.config
        { label' = "Departure"
        , placeholder' = ""
        , classes = gridSpec
        , autofocus = True
        , toString = \stop -> stop.stop_name
        , errMsg = m.deptInputErrMsg
        , isSubmit = False
        }

    arrivalConfig =
      DebouncedAutocomplete.config
        { label' = "Arrival"
        , placeholder' = ""
        , classes = gridSpec
        , autofocus = False
        , toString = \stop -> stop.stop_name
        , errMsg = m.arrvlInputErrMsg
        , isSubmit = True
        }

    deptStops =
      List.filter m.deptInputFilterPred stops

    arrvlStops =
      List.filter m.arrvlInputFilterPred stops

    cardConfig =
      { gridSpec = "col s12 m8 offset-m2" }

    onClickMsg =
      FetchRoute (m.deptStop) (m.arrvlStop)
  in
    div
      [ class "container" ]
      [ div
          [ class "row" ]
          [ DebouncedAutocomplete.root deptConfig m.deptInput deptStops
              |> Html.App.map DeptInput
          , DebouncedAutocomplete.root arrivalConfig m.arrvlInput arrvlStops
              |> Html.App.map ArrvlInput
          ]
        , div
            [ class "row" ]
            [ button onClickMsg ]
        , div
            [ class "row" ]
            (List.map (Card.root cardConfig) m.route)
      ]

button : Msg -> Html Msg
button onClickMsg =
  let
    griddedButtonClass =
      "waves-effect waves-light btn col s12 m2 offset-m10"
  in
     a
      [ class griddedButtonClass
      , onClick onClickMsg
      ]
      [ text "Search" ]
