module Utils exposing (..)

import List

-- Shorthand map over List-like
(<$) : (a -> b) -> List a -> List b
(<$) f lx = List.map f lx                        -- <$> in Haskell

($>) : List a -> (a -> b) -> List b
($>) lx f = List.map f lx
infixr 2 <$
infixr 2 $>

-- Shorthand sequential application
-- <*> in Haskell
(<$$) : List (a -> b) -> List a -> List b
(<$$) fs xs =
  case (fs, xs) of
    (f::fs, _) -> List.map f xs ++ ((<$$) fs xs)
    ([], _)   -> []

($$>) : List a -> List (a -> b) -> List b
($$>) lx lf = (<$$) lf lx   -- <**> in Haskell
infixr 1 <$$
infixr 1 $$>

--Shorthand map over Maybe
(<?) : (a -> b) -> Maybe a -> Maybe b
(<?) f mx = case mx of                      -- <$> in Haskell
  (Just x) -> Just (f x)
  Nothing  -> Nothing

(?>) : Maybe a -> (a -> b) -> Maybe b
(?>) mx f = case mx of
  Just x  -> Just (f x)
  Nothing -> Nothing
infixr 2 <?
infixr 2 ?>

-- Shorthand sequential application
-- <*> in Haskell
(<??) : Maybe (a -> b) -> Maybe a -> Maybe b
(<??) mf mx =
  case (mf,mx) of
    (Just f, Just x) -> Just (f x)
    _                -> Nothing

-- (<**>) in Haskell
(??>) : Maybe a -> Maybe (a -> b) -> Maybe b
(??>) mx mf =
  case (mx, mf) of
    (Just x, Just f) -> Just (f x)
    _                -> Nothing
infixr 1 <??
infixr 1 ??>


zip : List a -> List b -> List (a,b)
zip xs ys = zipWith (,) xs ys

zipWith : (a -> b -> c) -> List a -> List b -> List c
zipWith f xs ys =
  case (xs, ys) of
    ([], _) -> []

    (_, []) -> []

    (x::xs, y::ys) ->
      f x y :: zipWith f xs ys

zipWith1 : (a -> a -> b) -> (a -> b) -> List a -> List a -> List b
zipWith1 f g xs ys =
  case (xs, ys) of
    ([], []) -> []

    ([], (y::ys)) -> g y :: zipWith1 f g xs ys

    ((x::xs), []) -> g x :: zipWith1 f g xs ys

    (x::xs, y::ys) ->
      f x y :: zipWith1 f g xs ys

isJust : Maybe a -> Bool
isJust ma =
  case ma of
    Just _ -> True
    _      -> False

g : List (a -> b) -> a -> List b
g fs x = List.map ((|>) x) fs
