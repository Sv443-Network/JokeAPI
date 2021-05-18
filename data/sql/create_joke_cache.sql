CREATE TABLE joke_cache (
	`ClientIpHash` VARCHAR(96) NOT NULL COLLATE 'utf8_bin',
	`JokeID` INT(6) NOT NULL COLLATE 'utf8_bin',
	`LangCode` VARCHAR(2) NOT NULL COLLATE 'utf8_bin',
	`DateTime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`ClientIpHash`, `JokeID`, `LangCode`),
    INDEX ByClient (`ClientIpHash`),
    INDEX ByClientAndLang (`ClientIpHash`, `LangCode`)
)
COLLATE='utf8_bin';