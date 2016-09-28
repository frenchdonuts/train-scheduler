module IntraDayTime exposing (..)


type Time =
  Time
    { hr : Int
    , min : Int
    , sec : Int
    }
time : { hr:Int, min:Int, sec:Int } -> Time
time { hr, min, sec } =
  Time
    { hr = hr
    , min = min
    , sec = sec
    }

toString : Time -> String
toString (Time { hr, min, sec }) =
  Basics.toString hr ++ ":" ++ Basics.toString min ++ ":" ++ Basics.toString sec

toReadable : Time -> String
toReadable (Time { hr, min, sec }) =
  let
    hr' =
      if hr > 1 then
        Basics.toString hr ++ "hrs "
      else if hr > 0 then
        Basics.toString hr ++ "hr "
      else
        ""
    min' =
      if min > 1 then
        Basics.toString min ++ "mins "
      else if min > 0 then
        Basics.toString min ++ "min "
      else
        ""
    sec' =
      if sec > 1 then
        Basics.toString sec ++ "secs "
      else if sec > 0 then
        Basics.toString sec ++ "sec "
      else
        ""
  in
    hr'++ min' ++ sec'


sub : Time -> Time -> Time
sub (Time time0) (Time time1) =
  let
    ( hr0, min0, sec0 ) =
      case time0 of
        { hr, min, sec } -> (hr, min, sec)
    ( hr1, min1, sec1 ) =
      case time1 of
        { hr, min, sec } -> (hr, min, sec)

    base10 =
      (3600*hr0 + 60*min0 + sec0) - (3600*hr1 + 60*min1 + sec1)
    (hr, n) = (base10 // 3600, base10 `rem` 3600)
    (min, n') = (n // 60, n `rem` 60)
    sec = n'
  in
    Time
      { hr = hr
      , min = min
      , sec = sec
      }
