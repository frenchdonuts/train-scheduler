module Autocomplete.State exposing (initModel, update)

import Autocomplete.Types exposing (..)

initModel : Model
initModel =
  initModelWithDefaultInput ""

initModelWithDefaultInput : String -> Model
initModelWithDefaultInput inputText =
  { selectedChoiceIndex = 0
  , choicesVisible = False
  , userInput = inputText
  }

update : Msg -> Model -> Model
update msg m =
  case msg of
    SetUserInput text ->
      { m | userInput = text }

    SelectNextChoice numChoices ->
      let
        i = m.selectedChoiceIndex + 1
        selectedChoiceIndex' = min i numChoices
      in
        { m | selectedChoiceIndex = selectedChoiceIndex' }

    SelectPrevChoice numChoices ->
      let
        i = m.selectedChoiceIndex - 1
        selectedChoiceIndex' = max i 0
      in
        { m | selectedChoiceIndex = selectedChoiceIndex' }

    HideChoices ->
      { m | choicesVisible = False }

    ShowChoices ->
      { m | choicesVisible = True }
