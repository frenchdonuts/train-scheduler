#!/usr/bin/env stack
-- stack --install-ghc runghc --package turtle

                                    -- #!/bin/bash
{-# LANGUAGE OverloadedStrings #-}

import Turtle (echo, input, stdout, strict)
import Data.Attoparsec.Text (Parser, parseOnly, many', takeWhile1, isEndOfLine, isHorizontalSpace, skipSpace)
import Data.ByteString (ByteString)
import Data.Text (Text, pack)


data Pair = Pair Text Text
instance Show Pair where
  show (Pair abbr name) = " (" ++ (show abbr) ++ ", " ++ (show name) ++ ")\n"


parsePair :: Parser Pair
parsePair = do
  abbr <- takeWhile1 $ not . isHorizontalSpace
  skipSpace
  stationName <- takeWhile1 $ not . isEndOfLine
  skipSpace
  return $ Pair abbr stationName

parsePairs :: Parser [Pair]
parsePairs = many' parsePair

parseAndHandleErr :: Either String [Pair] -> Text
parseAndHandleErr x =
  case x of
    Left err -> pack err
    Right pairs -> pack $ show pairs


main = do
  file <- strict (input "abbr-name")
  echo $ (parseAndHandleErr . parseOnly parsePairs) file

--"12th\&912th St. Oakland City Center"
