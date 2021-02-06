[<< Home](./home.md#readme)
# Joke Caching [WIP]
Joke caching is used to prevent a client from getting the same joke multiple times consecutively.  
This feature had a half-assed implementation since version 2.0.0 but had a huge overhaul in version 2.4.0 (and now actually works as it should).  
  
The original plan was to store jokes in RAM, but after seeing how many hundreds of thousands of requests JokeAPI gets daily, I chose to use an SQL database instead.


<br><br><br><br>

[<< Home](./home.md#readme)
