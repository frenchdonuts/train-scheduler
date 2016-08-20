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
    { departureStop = Autocomplete.initModel
    , arrivalStop = Autocomplete.initModel
    , route = []
    , stops = []
    }


initialCommands : Cmd Msg
initialCommands =
    Cmd.batch
      [ getStops () ]


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

        FetchStopsSucceed stops ->
          ( { m | stops = stops }, Cmd.none )

        FetchStopsFail err ->
          ( m, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions m =
  Sub.batch
    [ routes FetchRouteSucceed
    , stops FetchStopsSucceed
    ]

port computeRoute : (String, String) -> Cmd msg

port routes : (List Stop.StopTime -> msg) -> Sub msg

port getStops : () -> Cmd msg
port stops : (List Stop.Stop -> msg) -> Sub msg
