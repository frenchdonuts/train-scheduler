module Autocomplete.State exposing (initialModel, initModelWithChoices, update)

import Autocomplete.Types exposing (..)

initialModel : Model
initialModel =
  { selectedChoiceIndex = 0
  , choices = [ "" ]
  , choicesVisible = False
  }

initModelWithChoices : List String -> Model
initModelWithChoices choices =
  { initialModel | choices = initialModel.choices ++ choices }

update : Msg -> Model -> Model
update msg m =
  case msg of
    SetUserInput string ->
      let
        choices' = [ string ] ++ List.drop 1 m.choices
      in
        { m | choices = choices' }

    SetChoicesVisibility isVisible ->
      { m | choicesVisible = isVisible }

    SelectNextChoice ->
      let
        i = m.selectedChoiceIndex + 1
        selectedChoiceIndex' = min i ( List.length m.choices )
      in
        { m | selectedChoiceIndex = selectedChoiceIndex' }

    SelectPrevChoice ->
      let
        i = m.selectedChoiceIndex - 1
        selectedChoiceIndex' = max i 0
      in
        { m | selectedChoiceIndex = selectedChoiceIndex' }
