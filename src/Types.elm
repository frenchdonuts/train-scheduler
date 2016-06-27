module Types exposing (..)

{-| This module defines the Shape of some application state and and operations
allowed on that Shape. Notice that these operations are closed aka they don't
change the Shape.

No implementation details.
-}

import Autocomplete.Types
-- Shape


type alias Model =
    { startInput : Int
    , destInput : Int
    }



-- Operations


type Msg
    = NoOp
