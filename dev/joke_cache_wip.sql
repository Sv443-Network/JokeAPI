-- for recreating the tables
DROP TABLE joke_cache;

CREATE TABLE joke_cache (
	`ClientIpHash` VARCHAR(96) NOT NULL COLLATE 'utf8_bin',
	`JokeID` INT(6) NULL DEFAULT NULL COLLATE 'utf8_bin',
	`LangCode` VARCHAR(2) NOT NULL COLLATE 'utf8_bin',
	`DateTime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`ClientIpHash`, `JokeID`, `LangCode`)
)
COLLATE='utf8_bin';


DROP TABLE client_index;

CREATE TABLE client_index (
	`ClientIpHash` VARCHAR(96) NOT NULL COLLATE 'utf8_bin',
	`LastActive` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`ClientIpHash`)
)
COLLATE='utf8_bin';
-- //recreate tables



SELECT * FROM joke_cache;

-- Add a new entry to a client's cache list
INSERT INTO joke_cache (ClientIpHash, JokeID, LangCode) VALUES (
	-- "eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3",
	"818503e10b0d60e9ee016770d38c3a05030d9d41d2f6cfee427388bd8bcb221f",
	93,
	"de"
);


SELECT * FROM client_index;

-- Add a new entry to the client index
INSERT INTO client_index (ClientIpHash) VALUES (
	"eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3"
	-- "818503e10b0d60e9ee016770d38c3a05030d9d41d2f6cfee427388bd8bcb221f",
);


-- total count of ef's cache list
SELECT COUNT(*) AS "Total cache list entries of 'ef'" FROM joke_cache WHERE ClientIpHash = "eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3";

-- list of joke IDs to NOT serve to the provided client
SELECT JokeID FROM joke_cache
	WHERE ClientIpHash = "eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3"
	AND LangCode = "de"
	ORDER BY JokeID ASC;

SELECT * FROM joke_cache;

-- list all entries of the table to delete (because the client was inactive for the provided
-- SELECT * FROM id_caching WHERE `DateTime` BETWEEN '2021-01-30 16:11:45' AND CURRENT_TIMESTAMP;

SELECT `DateTime` FROM joke_cache;
SELECT DATE_ADD(joke_cache.`DateTime`, INTERVAL 30 MINUTE) FROM joke_cache;


-- list all joke IDs of specified langcode and the provided client IP hash
SELECT JokeID FROM joke_cache
	WHERE ClientIpHash = "eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3"
	AND LangCode = "en";