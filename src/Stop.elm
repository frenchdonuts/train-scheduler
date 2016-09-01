module Stop exposing (Stop, StopTime)


type alias Stop =
  { stop_id : String
  , stop_name : String
  }

type alias StopTime =
  { stop_id : String
  , departure_time : String
  , arrival_time : String
  , stop_sequence : Int
  , trip_id : String
  }
