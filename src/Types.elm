module Types exposing (..)

{-| We define here the Shape of the Application State and what Operations we
may perform on that State. No implementation details.

Note that these Operations are closed aka they don't change the Shape.
-}
import DebouncedAutocomplete
import Stop exposing (Stop)
import Card exposing (State)
import Http exposing (Error)
import Dict exposing (..)

type alias Model =
  { deptInput : DebouncedAutocomplete.Model
  , deptInputFilterPred : (Stop.Stop -> Bool)
  , deptStop : Maybe Stop.Stop
  , deptInputErrMsg : String
  , arrvlInput : DebouncedAutocomplete.Model
  , arrvlStop : Maybe Stop.Stop
  , arrvlInputFilterPred : (Stop.Stop -> Bool)
  , arrvlInputErrMsg : String
  , route : List Card.State
  , stops : List Stop.Stop
  , stopDict : Dict String String
  }


type Msg
  = NoOp
  | DeptInput DebouncedAutocomplete.Msg
  | ArrvlInput DebouncedAutocomplete.Msg
  | FetchRoute (Maybe Stop.Stop) (Maybe Stop.Stop)
  | FetchRouteSucceed (List Stop.StopTime)
  | FetchRouteFail Error
  | FetchStopsSucceed (List Stop.Stop)
  | FetchStopsFail Error
