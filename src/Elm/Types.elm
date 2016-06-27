module Types exposing (..)

{-| We define here the Shape of the Application State and what Operations we
may perform on that State. No implementation details.

Notice that these Operations are closed aka they don't change the Shape.
-}
import Autocomplete.Types as Autocomplete

type alias Model =
  { startInput : Autocomplete.Model
  , destInput : Autocomplete.Model
  }


type Msg
  = NoOp
  | StartInput Autocomplete.Msg
  | DestInput Autocomplete.Msg
