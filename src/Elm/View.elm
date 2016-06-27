module View exposing (root)

{-| This module's sole purpose is to render the State as defined in Types and
map User inputs to Operations as defined in Types
-}
import Types exposing (..)
import Autocomplete.View as Autocomplete
import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)

root : Model -> Html Msg
root m =
  div
    []
    [ Html.App.map StartInput <| Autocomplete.root m.startInput ]
