module Autocomplete.View exposing (Config, root)



import Autocomplete.Types exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Json


type alias Config choice =
  { label' : Maybe String
  , placeholder' : Maybe String
  , classes : String  -- Make this more type-safe
  , autofocus : Bool
  , toString : choice -> String
  --, update : Msg -> msg
  }

autofocus' :
  { a
  | label' : Maybe String
  , placeholder' : Maybe String
  , classes : String
  , autofocus : Bool
  , toString : choice -> String
  }
  -> { a
     | label' : Maybe String
     , placeholder' : Maybe String
     , classes : String
     , autofocus:Bool
     , toString : choice -> String
     }
autofocus' config = config


root : Config choice -> Model -> List choice -> Html Msg
root config m choices =
  let
    numChoices =
      List.length choices

    labelString =
      Maybe.withDefault "" <| config.label'

    placeholderString =
      Maybe.withDefault "" <| config.placeholder'

    inputClass =
      if config.autofocus then "focus-field" else ""

    keydownDecoder =
      Json.customDecoder
        keyCode
        (\code ->
            case code of
              -- Arrow Down
              40 ->
                Ok (SelectNextChoice numChoices)

              -- Arrow Up
              38 ->
                Ok (SelectPrevChoice numChoices)

              -- Esc
              27 -> Ok HideChoices

              _ ->
                Err "not handling that keycode"
        )
  in
    div
      [ class <| config.classes ++ " input-field "]
      [ input
          [ id <| labelString ++ "-field"
          , class inputClass
          , type' "text"
          , value <| m.userInput
          , onInput SetUserInput
          , onFocus ShowChoices
          , onBlur HideChoices
          , placeholder placeholderString
          , autofocus config.autofocus
          , on "keydown" keydownDecoder
          ]
          []
      , label
          [ for <| labelString ++ "-field"
          , attribute "data-error" ""
          , class "active"
          ]
          [ text labelString ]
      , listView m.choicesVisible <| List.map config.toString choices
      ]

listView : Bool -> List String -> Html Msg
listView visible names =
  let
    style' =
      [ ( "position", "absolute" )
      --, ( "margin-top", "-14px" )
      , ( "z-index", "10000" )
      ]

    isHidden = not visible
  in
    ul
      [ class "collection"
      , style style'
      , hidden isHidden
      ]
      ( List.map itemView names )

itemView : String -> Html Msg
itemView name =
  li
    [ class "collection-item" ]
    [ text name ]
