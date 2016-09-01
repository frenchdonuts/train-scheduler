module Autocomplete.State exposing (init, update, isEmpty)

import Autocomplete.Types exposing (..)
import String

init : Model
init =
  initModelWithDefaultInput ""

initModelWithDefaultInput : String -> Model
initModelWithDefaultInput inputText =
  { selectedChoiceIndex = -1
  , choicesVisible = False
  , userInput = inputText
  , currentChoice = inputText
  }

isEmpty : Model -> Bool
isEmpty = String.isEmpty << .userInput

update : Msg -> Model -> Model
update msg m =
  case msg of
    SetUserInput text ->
      { m
      | userInput = text
      , currentChoice = text
      , choicesVisible = not <| String.isEmpty text
      -- By setting selectedChoiceIndex to -1 when the User starts typing, we
      --  prevent inconsistencies w/ selectedChoiceIndex - imagine that we use
      --  userInput to filter the data and this triggers a change in the number
      --  of choices being displayed.
      -- It is also semantically more accurate: when the User starts typing,
      --  the User's choice IS whatever is in the input box - not in the list
      --  of choices.
      -- Given these reflections^, should we actually be putting filterPred in
      --  Autocomplete.Model and not in Autocomplete.View.Config? It would make
      --  it easier to see why setting selectedChoiceIndex to -1 is the correct
      --  way to model this problem. Right now, the importance of maintaining
      --  the invariant: -1 <= selectedChoiceIndex < numChoices is IMPLICIT. Is
      --  their a way to make it more explicit? How can we make it more explicit
      --  that numChoices can CHANGE, and therefore maintaining that invariant
      --  actually takes some work.
      , selectedChoiceIndex = -1
      }

    SelectNextChoice displayStrings ->
      let
        numChoices =
          List.length displayStrings

        i =
          m.selectedChoiceIndex + 1

        selectedChoiceIndex' =
          if i > (numChoices - 1) then
            -1
          else
            i

        currentChoice' =
          computeCurrentChoice selectedChoiceIndex' m.userInput displayStrings
      in
        { m
        | selectedChoiceIndex = selectedChoiceIndex'
        , choicesVisible = True
        , currentChoice = currentChoice'
        }

    SelectPrevChoice displayStrings ->
      let
        numChoices =
          List.length displayStrings

        i =
          m.selectedChoiceIndex - 1

        selectedChoiceIndex' =
          if i < -1 then
            numChoices - 1
          else
            i

        currentChoice' =
          computeCurrentChoice selectedChoiceIndex' m.userInput displayStrings
      in
        { m
        | selectedChoiceIndex = selectedChoiceIndex'
        , choicesVisible = True
        , currentChoice = currentChoice'
        }

    SelectChoice choiceString i ->
      { m
      | selectedChoiceIndex = i
      , currentChoice = choiceString
      }

    SelectCurrentChoice ->
      { m
      | userInput = m.currentChoice
      , choicesVisible = False
      , selectedChoiceIndex = -1
      }

    HideChoices ->
      { m | choicesVisible = False }

    ShowChoices ->
      { m | choicesVisible = not ( String.isEmpty m.userInput ) }

    Submit ->
      m


computeCurrentChoice : Int -> String -> List String -> String
computeCurrentChoice selectedChoiceIndex userInput choicesStrings =
  if selectedChoiceIndex > -1 then
    case List.drop selectedChoiceIndex choicesStrings |> List.head of
      Just choiceString -> choiceString

      Nothing -> userInput
  else
    userInput
