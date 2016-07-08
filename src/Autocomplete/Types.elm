module Autocomplete.Types exposing (..)

type alias Model =
  { selectedChoiceIndex : Int
  , choices : List String
  , choicesVisible : Bool
  }


type Msg
  = SetUserInput String
  | SetChoicesVisibility Bool
  | SelectNextChoice
  | SelectPrevChoice
