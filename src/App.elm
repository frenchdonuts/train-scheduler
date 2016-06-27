port module App exposing (main)

{-| The module that ties Type, State, and View all together.
Interestingly, it doesn't even need to import the Type module!

This is also where we define any ports to and from JS.
-}

import State as State
import View as View
import Html.App


main : Program Never
main =
    Html.App.program
        { init =
            ( State.initialModel
            , State.initialCommands
            )
        , view = View.root
        , update = State.update
        , subscriptions = always Sub.none
        }


port focusOnFirstInputAboveFold : String -> Cmd msg
