module DebouncedAutocomplete exposing (..)


import Autocomplete.Types
import Autocomplete.State
import Autocomplete.View
import Debouncer
import Html exposing (..)
import Html.App
import Maybe


-- Model

type alias Model =
  { autocomplete : Autocomplete.Types.Model
  , debouncer : Debouncer.Model
  }

init : Float -> Model
init interval =
  { autocomplete = Autocomplete.State.init
  , debouncer = Debouncer.init interval
  }

isEmpty : Model -> Bool
isEmpty = .autocomplete >> Autocomplete.State.isEmpty


-- Msg

type Msg
  = Autocomplete Autocomplete.Types.Msg
  | DebouncerMsg Debouncer.Msg

type OutMsg
  = Debounced String


-- Update

update : Msg -> Model -> (Model, Cmd Msg, Maybe OutMsg)
update msg m =
  case msg of
    Autocomplete cmsg ->
      let
        ( debouncer', cmd, _ ) =
          case cmsg of
            -- If we are setting the user input on the Autocomplete component,
            --  Bounce our debouncer
            Autocomplete.Types.SetUserInput _ ->
              Debouncer.update Debouncer.Bounce m.debouncer
            -- Don't forget: We also set userInput when the User selects a choice!
            --  (took me a while the debug this)
            Autocomplete.Types.SelectCurrentChoice ->
              Debouncer.update Debouncer.Bounce m.debouncer

            -- Otherwise, do nothing to our debouncer
            _ ->
              ( m.debouncer, Cmd.none, Nothing )
      in
        ( { m
          | autocomplete = Autocomplete.State.update cmsg m.autocomplete
          , debouncer = debouncer'
          }
        , Cmd.map DebouncerMsg cmd
        , Nothing )

    DebouncerMsg cmsg ->
      let
        ( debouncer', cmd, maybeOutMsg ) =
          Debouncer.update cmsg m.debouncer

        currentInput =
          m.autocomplete.userInput
      in
        ( { m
          | debouncer = debouncer'
          }
        , Cmd.map DebouncerMsg cmd
        , Maybe.map (\_ -> Debounced currentInput) maybeOutMsg )


-- View

config
  : { label' : String
    , placeholder' : String
    , classes : String
    , autofocus : Bool
    , toString : choice -> String
    , errMsg : String
    , isSubmit : Bool
    }
  -> Autocomplete.View.Config choice
config = Autocomplete.View.config

root : Autocomplete.View.Config choice
    -> Model
    -> List choice
    -> Html Msg
root config model choices =
  Autocomplete.View.root config model.autocomplete choices
    |> Html.App.map Autocomplete
