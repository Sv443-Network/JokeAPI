## Multiple joke categories:
```ts
enum Category {
    Misc = 1,
    Programming = 2,
    Dark = 4,
    Pun = 8,
    Spooky = 16,
    Christmas = 32,
}
```

Encoding: Add together all numbers  
e.g. Programming + Pun = 10  

<br>

Decoding: Start from bottom of enum and subtract if result >= 0  
e.g.:
```ts
10 - 32 (Chris.)  = -22 (skip)
10 - 16 (Spooky)  = -6  (skip)
10 - 8  (Pun)     = 2
 2 - 4  (Dark)    = -2  (skip)
 2 - 2  (Progr.)  = 0
 0 - 1  (Misc)    = -1  (skip)
```
Result: Pun & Programming
