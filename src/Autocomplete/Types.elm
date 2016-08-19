module Autocomplete.Types exposing (..)

type alias Model =
  { selectedChoiceIndex : Int
  , choicesVisible : Bool
  , userInput : String
  }


type Msg
  = SetUserInput String
  | SelectNextChoice Int
  | SelectPrevChoice Int
  | HideChoices
  | ShowChoices
