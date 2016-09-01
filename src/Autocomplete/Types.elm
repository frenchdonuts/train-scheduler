module Autocomplete.Types exposing (..)


type alias Model =
  { selectedChoiceIndex : Int
  , choicesVisible : Bool
  , userInput : String
  , currentChoice : String -- Should be called currentChoice
  }


type Msg
  --
  = SetUserInput String

  --| SetDisplayedInput String

  -- We need the number of choices to handle bounding logic:
  --  1) What to do when Users SelectNextChoice on the last choice
  | SelectNextChoice (List String) -- Rename OnArrowDown? SuccCurrentChoice? IncCurrentChoice?
  --  2) What to do when Users SelectPrevChoice on the first choice
  | SelectPrevChoice (List String) -- Rename OnArrowUp? PredCurrentChoice? DecCurrentChoice?

  -- We need both the String representation of the data and the index so we can
  --  update currentChoice and selectedChoiceIndex
  | SelectChoice String Int -- Rename OnChoiceMouseHover? SetCurrentChoice?

  -- User has finally chosen a choice; name OnChoiceChosen?
  | SelectCurrentChoice  -- Rename OnSelectChoice?

  --
  | HideChoices
  --

  | ShowChoices
  | Submit
