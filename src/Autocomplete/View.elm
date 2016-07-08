module Autocomplete.View exposing (Config, root)



import Autocomplete.Types exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)


type alias Config =
  { label' : Maybe String
  , placeholder' : Maybe String
  , classes : String  -- Make this more type-safe
  , autofocus : Bool
  }

root : Config -> Model -> Html Msg
root config m =
  let
    inputValue =
      Maybe.withDefault "" <| List.head m.choices

    choices =
      Maybe.withDefault [] <| List.tail m.choices

    labelString =
      Maybe.withDefault "" <| config.label'

    placeholderString =
      Maybe.withDefault "" <| config.placeholder'

    inputClass =
      if config.autofocus then "focus-field" else ""
  in
    div
      [ class <| config.classes ++ " input-field "]
      [ input
          [ id <| labelString ++ "-field"
          , class inputClass
          , type' "text"
          , value <| inputValue
          , onInput SetUserInput
          , onFocus ( SetChoicesVisibility True )
          , onBlur ( SetChoicesVisibility False )
          , placeholder placeholderString
          , autofocus config.autofocus
          ]
          []
      , label
          [ for <| labelString ++ "-field"
          , attribute "data-error" ""
          , class "active"
          ]
          [ text labelString ]
      , ul
          []
          ( List.map (\choice -> text choice) choices )
      ]
