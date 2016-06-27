module State exposing (initialModel, initialCommands, update)

{- This module defines the actual implementations of Shape construction
   (initialModel) and the operations on Shape (update).
-}

import Types exposing (..)
import Autocomplete.State as Autocomplete


initialModel : Model
initialModel =
    { startInput = Autocomplete.initialModel
    , destInput = Autocomplete.initialModel
    }


initialCommands : Cmd Msg
initialCommands =
    Cmd.batch []


update : Msg -> Model -> ( Model, Cmd Msg )
update msg m =
    case msg of
        NoOp ->
            ( m, Cmd.none )

        StartInput msg ->
          ( { m
            | startInput = Autocomplete.update msg m.startInput
            }
          ,
          Cmd.none )

        DestInput msg ->
          ( { m
            | destInput = Autocomplete.update msg m.destInput
            }
          ,
          Cmd.none )
