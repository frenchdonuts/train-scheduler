module Debouncer exposing (Debouncer, init, Msg(Bounce), OutMsg, update)

import Task
import Process
import Time
--import Debug


type alias Debouncer =
  { id : Int
  , interval : Float
  --, pmsgCmd : Maybe (Cmd msg)
  }

init : Float -> Debouncer
init interval =
  { id = 0
  , interval = interval
--  , pmsgCmd = Nothing
  }

type Msg
  = Bounce --(Cmd pmsg)
  | Timeout Int

type OutMsg
  = Debounced

{-| How this will work:
    We pass up a Cmd that will dispatch (Timeout newId) in interval(ms)
    The Parent will map that (Cmd Debouncer.Msg) to (Cmd Parent.Msg) by wrapping
     in a data constructor, DeptInputDebouncerMsg, or something
    When the Cmd is dispatched, the parent's update WILL RUN and hit the branch
     that deals w/ DeptInputDebouncerMsg. We run Debouncer.update and that's
     how the Parent will see the OutMsg, Debounced.
    When the Parent sees that OutMsg, it will just return:
     Parent.update (Parent.Msg) Parent.Model
    Where, in our case, Parent.Msg is going to be something like FilterChoicesMsg
-}
update : Msg -> Debouncer -> (Debouncer, Cmd Msg, Maybe OutMsg)
update msg debouncer =
  case msg of
    Bounce ->
      let
        newId =
          debouncer.id + 1
        pingNewIdCmd newId =
          Process.sleep (debouncer.interval * Time.millisecond)
            |> Task.perform identity (\_ -> Timeout newId)
      in
        ( { debouncer
          --| pmsgCmd = Just pmsgCmd
          | id = newId
          }
        , pingNewIdCmd newId
        , Nothing
        )

    Timeout id ->
      if debouncer.id == id then
        ( { debouncer | id = 0 },  Cmd.none, Just Debounced )
      else
        ( debouncer, Cmd.none, Nothing )

{-|
update : Msg pmsg -> Debouncer pmsg -> (Debouncer pmsg, Cmd (Msg pmsg))
update msg debouncer =
  case msg of
    Bounce pmsgCmd ->
      let
        newId =
          debouncer.id + 1
        pingNewIdCmd newId =
          Process.sleep (debouncer.interval * Time.millisecond)
            |> Task.perform identity (\_ -> Timeout newId)
      in
        ( { debouncer
          | pmsgCmd = Just pmsgCmd
          , id = newId
          }
        , pingNewIdCmd newId)

    Timeout id ->
      let
        cmd =
          case debouncer.pmsgCmd of
            Just pmsgCmd -> Cmd.map ForParent pmsgCmd
            Nothing -> Cmd.none
      in
        if debouncer.id == id then
          ( { debouncer | id = 0 }, cmd )
        else
          ( debouncer, Cmd.none )

    ForParent _ ->
      ( debouncer, Cmd.none )
|-}
something : a -> a
something x = x
