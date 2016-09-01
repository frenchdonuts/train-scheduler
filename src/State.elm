port module State exposing (initialModel, initialCommands, update, subscriptions)

{- This module defines the actual implementations of Shape construction
   (initialModel) and the operations on Shape (update).
-}

import Types exposing (..)
import DebouncedAutocomplete
import Stop exposing (Stop)
import Card
import String exposing (contains)
import Dict exposing (..)
import Maybe
import Utils exposing (($$>), zip, zipWith, zipWith1)
import Debug
import IntraDayTime as Time
import Combine.Num as Num
import Combine.Char as Char
import Combine


initialModel : Model
initialModel =
    { deptInput = DebouncedAutocomplete.init 300
    , deptInputFilterPred = (\_ -> True)
    , deptStop = Nothing
    , deptInputErrMsg = "Please select a stop."
    , arrvlInput = DebouncedAutocomplete.init 300
    , arrvlInputFilterPred = (\_ -> True)
    , arrvlStop = Nothing
    , arrvlInputErrMsg = "Please select a stop."
    , route = []
    , stops = []
    , stopDict = Dict.empty
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

        DeptInput cmsg ->
          let
            ( deptInput1, filterPred1, cmd ) =
              handleInputs cmsg m.deptInput m.deptInputFilterPred

            filteredStops =
              List.filter filterPred1 m.stops

            errMsg =
              inputErrMsg deptInput1 m.stops

            selectedDeptStop =
              Debug.log "deptStop" <| computeSelectedStop deptInput1 filteredStops
          in
            ( { m
              | deptInput = deptInput1
              , deptInputFilterPred = filterPred1
              , deptStop = selectedDeptStop
              , deptInputErrMsg = errMsg
              }
            , Cmd.map DeptInput cmd )

        ArrvlInput cmsg ->
          let
            ( arrvlInput', filterPred', cmd ) =
              handleInputs cmsg m.arrvlInput m.arrvlInputFilterPred

            filteredStops =
              List.filter filterPred' m.stops

            errMsg =
              inputErrMsg arrvlInput' m.stops

            selectedArrvlStop =
              Debug.log "arrvlStop" <| computeSelectedStop arrvlInput' filteredStops
          in
            ( { m
              | arrvlInput = arrvlInput'
              , arrvlInputFilterPred = filterPred'
              , arrvlStop = selectedArrvlStop
              , arrvlInputErrMsg = errMsg
              }
            , Cmd.map ArrvlInput cmd )

        FetchRoute mDeptStop mArrvlStop ->
          let
            deptStop =
              Debug.log "deptStop" m.deptStop
            arrvlStop =
              Debug.log "arrvlStop" m.arrvlStop

            errSelectors =
              [ .deptInputErrMsg, .arrvlInputErrMsg ]

            noErrs =
              [m] $$> ( List.map ((<<) String.isEmpty) errSelectors )
                |> List.foldr (&&) True

            cmd =
              if noErrs then
                case (mDeptStop, mArrvlStop) of
                  (Just deptStop, Just arrvlStop) ->
                    computeRoute (deptStop.stop_id, arrvlStop.stop_id)
                  _ -> Cmd.none
              else
                Cmd.none
          in
            ( m, cmd )

        FetchRouteSucceed stopTimes ->
          let
            durationCards =
              zip stopTimes (List.drop 1 stopTimes)
                |> List.map (\(dept, arrvl) ->
                               Time.sub (parse arrvl.arrival_time)
                                        (parse dept.departure_time)
                                  |> Time.toReadable
                                  |> Card.duration)

            parse string =
              let
                -- 10:10:00
                parser : Combine.Parser { hr:Int, min:Int, sec:Int }
                parser =
                  Num.int `Combine.andThen` \hr ->
                  Combine.skip Char.anyChar `Combine.andThen` \_ ->
                  Num.int `Combine.andThen` \min ->
                  Combine.skip Char.anyChar `Combine.andThen` \_ ->
                  Num.int `Combine.andThen` \sec ->
                  Combine.succeed { hr = hr, min = min, sec = sec }
              in
                case Combine.parse parser string of
                  (Ok { hr, min, sec }, _) ->
                    Time.time { hr = hr, min = min, sec = sec }

                  _ ->
                    Time.time { hr = 0, min = 0, sec = 0 }

            stopCards =
              let
                name stopTime =
                    case Dict.get stopTime.stop_id m.stopDict of
                      Just stop_name -> stop_name
                      Nothing -> "No such stop."

                toStopCard stopTime =
                  Card.stop
                    { name = name stopTime
                    , deptTime = stopTime.departure_time
                    , arrvlTime = stopTime.arrival_time
                    }
              in
                List.map toStopCard stopTimes

            route =
              zipWith1 (\s d -> [s, d]) (\s -> [s]) stopCards durationCards
                |> List.concat
          in
            ( { m | route = route }, Cmd.none )

        FetchRouteFail err ->
          ( m, Cmd.none )

        FetchStopsSucceed stops ->
          ( { m
            | stops = stops
            , stopDict = Dict.fromList
                          <| List.map
                              (\stop -> (stop.stop_id, stop.stop_name))
                              stops
            }, Cmd.none )

        FetchStopsFail err ->
          ( m, Cmd.none )

handleInputs : DebouncedAutocomplete.Msg
            -> DebouncedAutocomplete.Model
            -> (Stop.Stop -> Bool)
            -> ( DebouncedAutocomplete.Model
               , (Stop.Stop -> Bool)
               , Cmd DebouncedAutocomplete.Msg )
handleInputs cmsg input filterPred =
  let
    ( arrvlInput', cmd, maybeOutMsg ) =
      DebouncedAutocomplete.update cmsg input

    filterPred' =
      case maybeOutMsg of
        Just (DebouncedAutocomplete.Debounced currentInput) ->
          let
            dCurrentInput = Debug.log "currentInput" currentInput
          in
            (\stop ->
              String.contains
                (String.toLower currentInput)
                (String.toLower stop.stop_name))

        Nothing -> filterPred
  in
    ( arrvlInput', filterPred', cmd )

inputErrMsg : DebouncedAutocomplete.Model -> List Stop.Stop -> String
inputErrMsg input allStops =
  let
    filteredStops =
      allStops
        |> List.filter (\stop -> stop.stop_name == input.autocomplete.userInput)
  in
    if ( DebouncedAutocomplete.isEmpty input ) then
      "Please select a stop."
    else if not ( List.length filteredStops == 1) then
      "Please select a valid stop."
    else
      ""

computeSelectedStop : DebouncedAutocomplete.Model -> List Stop.Stop -> Maybe Stop.Stop
computeSelectedStop input filteredStops =
  let
    --dFilteredStops = Debug.log "filteredStops" filteredStops

    mStop =
      Debug.log "mStop"
        <| Maybe.map (String.toLower << .stop_name) (List.head filteredStops)
    mUserInput =
      Debug.log "mUserInput"
      <| Just (String.toLower input.autocomplete.userInput)
  in
    case Maybe.map2 (==) mStop mUserInput of
      (Just True) -> List.head filteredStops
      _ -> Nothing


subscriptions : Model -> Sub Msg
subscriptions m =
  Sub.batch
    [ routes FetchRouteSucceed
    , stops FetchStopsSucceed
    ]

-- Out
port computeRoute : (String, String) -> Cmd msg
-- In
port routes : (List Stop.StopTime -> msg) -> Sub msg

-- Out
port getStops : () -> Cmd msg
-- In
port stops : (List Stop.Stop -> msg) -> Sub msg
