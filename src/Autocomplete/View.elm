module Autocomplete.View exposing (root)



import Autocomplete.Types exposing (..)
import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)

root : Model -> Html Msg
root m =
  div
    []
    [ text "Hello world!" ]
