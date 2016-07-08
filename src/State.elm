port module State exposing (initialModel, initialCommands, update, subscriptions)

{- This module defines the actual implementations of Shape construction
   (initialModel) and the operations on Shape (update).
-}

import Types exposing (..)
import Autocomplete.State as Autocomplete
import Stop exposing (Stop)
import Debug


initialModel : Model
initialModel =
    { departureStop = Autocomplete.initialModel
    , arrivalStop = Autocomplete.initialModel
    , route = []
    }


initialCommands : Cmd Msg
initialCommands =
    Cmd.batch []


update : Msg -> Model -> ( Model, Cmd Msg )
update msg m =
    case msg of
        NoOp ->
            ( m, Cmd.none )

        DepartureInput msg ->
          ( { m
            | departureStop = Autocomplete.update msg m.departureStop
            }
          ,
          Cmd.none )

        ArrivalInput msg ->
          ( { m
            | arrivalStop = Autocomplete.update msg m.arrivalStop
            }
          ,
          Cmd.none )

        FetchRoute stop1 stop2 ->
          ( m, computeRoute (stop1, stop2) )

        FetchRouteSucceed route ->
          let
            temp = Debug.log "FetchRouteSucceed" route
          in
            ( { m | route = route }, Cmd.none )

        FetchRouteFail err ->
          ( m, Cmd.none )


port computeRoute : (Int, Int) -> Cmd msg

port routes : (List Stop.Stop -> msg) -> Sub msg
subscriptions : Model -> Sub Msg
subscriptions m =
  routes FetchRouteSucceed
