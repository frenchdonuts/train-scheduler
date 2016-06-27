module View exposing (root)

{- This module concerns itself wholly with the visual representation of Shape. -}

import Types exposing (..)
import Html exposing (..)
import Html.App
import Html.Attributes exposing (..)


root : Model -> Html Msg
root model =
    div []
        []
