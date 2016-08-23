port module State exposing (initialModel, initialCommands, update, subscriptions)

{- This module defines the actual implementations of Shape construction
   (initialModel) and the operations on Shape (update).
-}

import Types exposing (..)
import Autocomplete.State as Autocomplete
import Debouncer
import Stop exposing (Stop)
import Debug


initialModel : Model
initialModel =
    { deptInput = Autocomplete.initModel
    , deptInputDebouncer = Debouncer.init 300
    , arrvlInput = Autocomplete.initModel
    , arrvlInputDebouncer = Debouncer.init 300
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
            | deptInput = Autocomplete.update msg m.deptInput
            }
          , Cmd.none )

        DeptInputDebouncer msg ->
          let
            ( debouncer', cmd, maybeOutMsg ) =
              Debouncer.update msg m.deptInputDebouncer
          in
            ( { m | deptInputDebouncer = debouncer' }
            , Cmd.map DeptInputDebouncer cmd )

        ArrivalInput msg ->
          ( { m
            | arrvlInput = Autocomplete.update msg m.arrvlInput
            }
          ,
           Cmd.none )

        ArrvlInputDebouncer msg ->
          let
            ( debouncer', cmd, maybeOutMsg ) =
              Debouncer.update msg m.arrvlInputDebouncer
          in
            ( { m | arrvlInputDebouncer = debouncer' }
            , Cmd.map ArrvlInputDebouncer cmd )

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
