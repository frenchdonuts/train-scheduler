module Autocomplete.View exposing (Config, config, root)



import Autocomplete.Types exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Json


type Config choice =
  Config
    { label' : String
    , placeholder' : String
    , classes : String  --TODO Make this more type-safe
    , autofocus : Bool
    , toString : choice -> String
    , errMsg : String
    , isSubmit : Bool
    }

config
  : { label' : String
    , placeholder' : String
    , classes : String
    , autofocus : Bool
    , toString : choice -> String
    , errMsg : String
    , isSubmit : Bool
    }
  -> Config choice
config { label', placeholder', classes, autofocus, toString, errMsg, isSubmit } =
  Config
    { label' = label'
    , placeholder' = placeholder'
    , classes = classes
    , autofocus = autofocus
    , toString = toString
    , errMsg = errMsg
    , isSubmit = isSubmit
    }

root : Config choice -> Model -> List choice -> Html Msg
root (Config config) m choices =
  let
    { label', placeholder', classes, autofocus, toString, errMsg, isSubmit } =
      config

    choicesStrings =
      List.map toString choices

    numChoices =
      List.length choices

    inputClass =
      let
        inputClass0 =
          "validate "

        invalid =
          case errMsg of
            "" -> ""
            _  -> "invalid "

        focus =
          if autofocus then
            "focus-field "
          else
            ""
      in
        inputClass0 ++ invalid ++ focus

    keydownDecoder =
      Json.customDecoder
        keyCode <|
        \code ->
            case code of
              -- Arrow Down
              40 ->
                Ok (SelectNextChoice choicesStrings)

              -- Arrow Up
              38 ->
                Ok (SelectPrevChoice choicesStrings)

              -- Enter
              13 ->
                Ok SelectCurrentChoice

              -- TAB
              9 ->
                Ok SelectCurrentChoice

              -- Esc
              27 ->
                Ok HideChoices

              _ ->
                Err "Will not handle this key code."

    inputValue =
      if m.selectedChoiceIndex > -1 then
        case List.drop m.selectedChoiceIndex choices |> List.head of
          Just choice -> toString choice

          Nothing -> m.userInput
      else
        m.userInput
  in
    div
      [ class <| "input-field " ++ classes
      , onFocus ShowChoices
      , onBlur HideChoices --( SetUserChoice inputValue )
      ]
      [ input
          [ id <| label' ++ "-field"
          , class inputClass
          , type' "text"
          , value m.currentChoice
          , onInput SetUserInput
          , placeholder placeholder'
          --, autofocus autofocus
          , on "keydown" keydownDecoder
          ]
          []
      , label
          [ for <| label' ++ "-field"
          , attribute "data-error" errMsg
          , class "active"
          ]
          [ text label' ]
      , listView
          m.choicesVisible
          ( List.map toString choices )
          m.selectedChoiceIndex
      ]

listView : Bool -> List String -> Int -> Html Msg
listView visible names selectedIndex =
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
      ( names
          |> List.indexedMap
              (\i name ->
                let
                  selected = i == selectedIndex
                in
                  itemView
                    name
                    selected
                    (SelectChoice name i)
                    SelectCurrentChoice
              )
      )

itemView : String -> Bool -> Msg -> Msg -> Html Msg
itemView name selected mouseEnterMsg clickMsg =
  let
    class' =
      if selected then
        "collection-item active"
      else
        "collection-item"
  in
    li
      [ class class'
      , onMouseEnter mouseEnterMsg
      , onClick clickMsg
      ]
      [ text name ]
