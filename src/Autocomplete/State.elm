module Autocomplete.State exposing (initialModel, update)

import Autocomplete.Types exposing (..)

initialModel : Model
initialModel =
  { inputText = ""
  }

update : Msg -> Model -> Model
update msg m =
  case msg of
    NoOp -> m
