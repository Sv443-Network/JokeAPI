# Select all
SELECT * FROM jokeapi.joke_cache;

# Select all by language
SELECT * FROM jokeapi.joke_cache WHERE LangCode = "de";

# Add entry
INSERT INTO jokeapi.joke_cache (
	ClientIpHash, JokeID, LangCode
) VALUES (
	"3e48ef9d22e096da6838540fb846999890462c8a32730a4f7a5eaee6945315f7",
    23,
    "de"
);

# Add expired entry
INSERT INTO jokeapi.joke_cache (
	ClientIpHash, JokeID, LangCode, `DateTime`
) VALUES (
	"3e48ef9d22e096da6838540fb846999890462c8a32730a4f7a5eaee6945315f7",
    1,
    "en",
    FROM_UNIXTIME(1628181409)
);

# Show expired cache entries
SELECT * FROM jokeapi.joke_cache WHERE DATE_ADD(`DateTime`, INTERVAL 96 HOUR) < CURRENT_TIMESTAMP;

# Delete expired cache entries
DELETE FROM jokeapi.joke_cache WHERE DATE_ADD(`DateTime`, INTERVAL 96 HOUR) < CURRENT_TIMESTAMP;

# Mark all cache entries as expired
UPDATE jokeapi.joke_cache SET `DateTime` = FROM_UNIXTIME(1628181409);

# Get all cache entries by client and langcode, sort by oldest first, with limit
SELECT * FROM jokeapi.joke_cache WHERE ClientIpHash = "3e48ef9d22e096da6838540fb846999890462c8a32730a4f7a5eaee6945315f7" AND LangCode = "de" ORDER BY `DateTime` ASC, JokeID ASC LIMIT 10;

# Delete all entries by client and langcode with matching joke ID
DELETE FROM jokeapi.joke_cache WHERE ClientIpHash = "3e48ef9d22e096da6838540fb846999890462c8a32730a4f7a5eaee6945315f7" AND LangCode = "en" AND JokeID IN (1, 2, 3);



# Other
SELECT * FROM jokeapi.joke_cache WHERE ClientIpHash = "3e48ef9d22e096da6838540fb846999890462c8a32730a4f7a5eaee6945315f7" AND LangCode = "de" ORDER BY `DateTime` ASC, JokeID ASC