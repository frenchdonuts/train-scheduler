module Types exposing (..)

{-| We define here the Shape of the Application State and what Operations we
may perform on that State. No implementation details.

Note that these Operations are closed aka they don't change the Shape.
-}
import Autocomplete.Types as Autocomplete
import Stop exposing (Stop)
import Http exposing (Error)

type alias Model =
  { departureStop : Autocomplete.Model
  , arrivalStop : Autocomplete.Model
  , route : List Stop.Stop
  }


type Msg
  = NoOp
  | DepartureInput Autocomplete.Msg
  | ArrivalInput Autocomplete.Msg
  | FetchRoute Int Int
  | FetchRouteSucceed (List Stop.Stop)
  | FetchRouteFail Error
