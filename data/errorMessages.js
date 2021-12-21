const settings = require("../settings");

module.exports = {
    //#MARKER Class 1xx (HTTP)
    "100": {
        "errorInternal": true,
        "errorMessage": {
            "en": "Internal Error in HTTP Server",
            "cs": "Interní chyba v HTTP serveru",
            "de": "Interner Error im HTTP Server",            
            "it": "Errore interno al server HTTP",
            "ru": "Внутренняя ошибка в HTTP-сервере",
        },
        "causedBy": {
            "en": [
                `An error in the code - please contact me through one of the options on my website (${settings.info.author.website}) with the additional info.`,
            ],
            "cs": [
                `Chyba v kódu - kontaktujte mě přes jedné z možností na mé webové stránce (${settings.info.author.website}) s dalšími informacemi.`,
            ],
            "de": [
                `Ein Error im Quellcode - bitte kontaktiere mich durch eine der Möglichkeiten auf meiner Website (${settings.info.author.website}) mit den zusätzlichen Informationen.`,
            ],
            "it": [
                `Un errore nel codice - per favore contattami tramite una delle opzioni sul mio sito (${settings.info.author.website}) fornendo maggiori informazioni.`,
            ],
            "ru": [
                `Ошибка в коде - пожалуйста, свяжитесь со мной через одну из опций на моем сайте (${settings.info.author.website}) с дополнительной информацией.`,
            ],
        },
    },
    "101": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Request blocked by Rate Limiting",
            "cs": "Požadavek byl blokován omezením míry",
            "de": "Anfrage blockiert durch Ratenbegrenzung",
            "it": "Richiesta bloccata per il superamento del limite di frequenza",
            "ru": "Запрос заблокирован ограничением скорости",
        },
        "causedBy": {
            "en": [
                `You have sent too many requests too quickly. The limit is ${settings.httpServer.rateLimiting} requests within ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "second" : "seconds"}.\nIf you need more requests per minute, please contact me and we can try to figure things out: ${settings.info.author.website}`,
            ],
            "cs": [
                `Příliš rychle jste odeslali příliš mnoho žádostí. Limit je ${settings.httpServer.rateLimiting} požadavků v rámci ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "sekunda" : "sekund"}.\n Pokud potřebujete více požadavků za minutu, kontaktujte mě a můžeme se domluvit: ${settings.info.author.website}`,
            ],
            "de": [
                `Du hast zu viele Anfragen zu schnell gesendet. Das Limit ist ${settings.httpServer.rateLimiting} Anfragen innerhalb von ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "Sekunde" : "Sekunden"}.\nWenn du mehr Anfragen pro Minute brauchst, kontaktiere mich bitte, damit wir es klären können: ${settings.info.author.website}`,
            ],
            "it": [
                `Hai inoltrato troppe richieste in poco tempo. Il limite è di ${settings.httpServer.rateLimiting} richieste in ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "secondo" : "secondi"}.\nSe hai bisogno di più richieste al minuto, per favore contattami per trovare una risoluzione: ${settings.info.author.website}`,
            ],
            "ru": [
                `Вы отправили слишком много запросов слишком быстро. Лимит составляет ${settings.httpServer.rateLimiting} запросов в пределах ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "секунда" : "секунды"}.\nЕсли Вам нужно больше запросов в минуту, пожалуйста, свяжитесь со мной, и мы попробуем разобраться в этом: ${settings.info.author.website}`,
            ],
        },
    },
    "102": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Requested Endpoint not found",
            "cs": "Koncový bod nebyl nalezen",
            "de": "Angefragten Endpunkt nicht gefunden",
            "it": "Endpoint richiesto non trovato",
            "ru": "Запрашиваемая конечная точка не найдена",
        },
        "causedBy": {
            "en": [
                "You sent a request to the wrong URL.",
            ],
            "cs": [
                "Odeslali jste požadavek na špatnou URL adresu.",
            ],
            "de": [
                "Du hast eine Anfrage an die falsche URL gesendet.",
            ],
            "it": [
                "Hai inoltrato una richiesta all'URL sbagliato.",
            ],
            "ru": [
                "Вы отправили запрос на неправильный URL-адрес.",
            ],
        },
    },
    "103": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Disreputable IP Address",
            "cs": "Pochybná IP adresa",
            "de": "In schlechtem Ruf stehende IP Addresse",
            "it": "Indirizzo IP illegittimo",
            "ru": "Дискредитирующий IP-адрес",
        },
        "causedBy": {
            "en": [
                `${settings.info.name} has found your IP address to be disreputable and added it to the blacklist.\nThis is probably because you have shown malicious behavior like an attempted interruption of ${settings.info.name}'s service.\n\nIf you believe this was done in error, please contact me (${settings.info.author.website}) so we can sort things out.`,
            ],
            "cs": [
                `${settings.info.name} zjistil, že vaše IP adresa má špatnou pověst a přidal ji na černou listinu.\nJe to pravděpodobně proto, že jste projevili škodlivé chování jako pokus o přerušení služby ${settings.info.name}.\n\nPokud si myslíte, že se to stalo omylem, kontaktujte mě (${settings.info.author.website}) abychom mohli věci vyřešit.`,
            ],
            "de": [
                `${settings.info.name} ist aufgefallen, dass deine IP Addresse einen schlechten Ruf hat und hat sie in die Ignorierungsliste eingetragen.\nDas ist wahrscheinlich passiert, weil du böswilliges Verhalten gezeigt hast, wie beispielsweise eine Unterbrechung von ${settings.info.name}'s Betrieb.\n\nWenn du meinst, das wurde fälschlicherweise gemacht, bitte kontaktiere mich hier: (${settings.info.author.website}).`,
            ],
            "it": [
                `${settings.info.name} ha trovato illegittimo il tuo indirizzo IP e lo ha aggiunto alla blacklist.\nQuesto è successo probabilmente perché hai dimostrato intenzioni malevoli come la tentata interruzione del servizio ${settings.info.name}.\n\nSe credi che sia stato non intenzionale, per favore contattami su (${settings.info.author.website}) così possiamo risolvere il problema.`,
            ],
            "ru": [
                `${settings.info.name} нашел ваш IP-адрес неблаговидным и добавил его в черный список.\nВероятно, это потому, что вы показали вредоносное поведение, например, попытку прерывания сервиса ${settings.info.name}.\n\nЕсли вы считаете, что это было сделано по ошибке, пожалуйста, свяжитесь со мной (${settings.info.author.website}), чтобы мы могли разобраться в этом.`,
            ],
        },
    },
    "104": {
        "errorInternal": true,
        "errorMessage": {
            "en": "Internal Error while calling Endpoint",
            "cs": "Interní chyba při volání koncového bodu",
            "de": "Interner Error während des Aufrufs eines Endpunktes",
            "it": "Errore interno nel tentativo di chiamata Endpoint",
            "ru": "Внутренняя ошибка при вызове конечной точки",
        },
        "causedBy": {
            "en": [
                `An error in the code - please contact me through one of the options on my website (${settings.info.author.website}) with the additional info.`,
            ],
            "cs": [
                `Chyba v kódu - kontaktujte mě přes jedné z možností na mé webové stránce (${settings.info.author.website}) s dalšími informacemi.`,
            ],
            "de": [
                `Ein Error im Quellcode - bitte kontaktiere mich durch eine der Möglichkeiten auf meiner Website (${settings.info.author.website}) mit den zusätzlichen Informationen.`,
            ],
            "it": [
                `Un errore nel codice - per favore contattami tramite una delle opzioni sul mio sito (${settings.info.author.website}) fornendo maggiori informazioni.`,
            ],
            "ru": [
                `Ошибка в коде - пожалуйста, свяжитесь со мной через одну из опций на моем сайте (${settings.info.author.website}) с дополнительной информацией.`,
            ],
        },
    },
    "105": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Malformed Joke",
            "cs": "Malformovaný vtip",
            "de": "Falsch formatierter Witz",
            "it": "Scherzo mal formattato",
            "ru": "Малоформальная шутка",
        },
        "causedBy": {
            "en": [
                "This joke was formatted incorrectly.",
            ],
            "cs": [
                "Tento vtip byl špatně formátován.",
            ],
            "de": [
                "Dieser Witz wurde nicht korrekt formatiert.",
            ],
            "it": [
                "Questa barzelletta non è stata formattata correttamente.",
            ],
            "ru": [
                "Эта шутка была отформатирована неправильно.",
            ],
        },
    },
    "106": {
        "errorInternal": false,
        "errorMessage": {
            "en": "No matching joke found",
            "cs": "Nebyl nalezen žádný odpovídající vtip",
            "de": "Kein übereinstimmender Witz gefunden",
            "it": "Nessuna barzelletta trovata",
            "ru": "Шутка не найдена",
        },
        "causedBy": {
            "en": [
                "No jokes were found that match your provided filter(s).",
            ],
            "cs": [
                "Nebyly nalezeny žádné vtipy, které by odpovídaly zadaným filtrům.",
            ],
            "de": [
                "Keine Witze wurden gefunden, die den Filtern entsprechen.",
            ],
            "it": [
                "Nessuna barzelletta corrisponde ai filtri da te specificati.",
            ],
            "ru": [
                "Не было найдено ни одной шутки, которая бы соответствовала вашему фильтру(ам).",
            ],
        },
    },
    "107": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Payload too large",
            "cs": "Datový obsah je příliš velký.",
            "de": "Anfrageinhalt zu groß",
            "it": "Payload troppo grande",
            "ru": "Слишком большое содержание запроса",
        },
        "causedBy": {
            "en": [
                `The provided payload exceeds the limit of ${settings.httpServer.maxPayloadSize} bytes (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB).`,
            ],
            "cs": [
                `Poskytovaný datový obsah překračuje limit ${settings.httpServer.maxPayloadSize} bytes (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB).`,
            ],
            "de": [
                `Der Anfrageinhalt ist größer als das Maximum von ${settings.httpServer.maxPayloadSize} bytes (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB).`,
            ],
            "it": [
                `Il payload fornito eccede il limite di ${settings.httpServer.maxPayloadSize} bytes (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB).`,
            ],
            "ru": [
                `Содержимое запроса больше максимального значения ${settings.httpServer.maxPayloadSize} байт (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB).`,
            ],
        },
    },
    "108": {
        "errorInternal": false,
        "errorMessage": {
            "en": "URL too long",
            "cs": "URL je moc dlouhá",
            "de": "URL zu lang",
            "it": "URL troppo lungo",
            "ru": "URL-адрес слишком длинный",
        },
        "causedBy": {
            "en": [
                `The URL (%1 characters) exceeds the maximum length of ${settings.httpServer.maxUrlLength} characters.`,
            ],
            "cs": [
                `URL (%1 znaků) překračuje maximální délku znaků ${settings.httpServer.maxUrlLength}.`,
            ],
            "de": [
                `Die angefragte URL (%1 Zeichen) überschreitet die Maximallänge von ${settings.httpServer.maxUrlLength} Zeichen.`,
            ],
            "it": [
                `L'URL (%1 caratteri) eccede la lunghezza massima di ${settings.httpServer.maxUrlLength} caratteri.`,
            ],
            "ru": [
                `Длина URL-адрес (%1 символов) превышает максимально допустимую длину в ${settings.httpServer.maxUrlLength} символа.`,
            ],
        },
    },
    "109": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Contains invalid characters",
            "cs": "Obsahuje neplatné znaky",
            "de": "Enthält unerlaubte Zeichen",
            "it": "Caratteri non validi trovati",
            "ru": "Содержит недопустимые символы",
        },
        "causedBy": {
            "en": [
                "The joke submission contains invalid characters outside the Unicode range of 0x0000 to 0x0fff",
            ],
            "cs": [
                "Podání vtipu obsahuje neplatné znaky mimo rozsah Unicode od 0x0000 do 0x0fff.",
            ],
            "de": [
                "Der eingereichte Witz enthält unerlaubte Zeichen außerhalb des Unicode-Bereichs 0x0000 bis 0x0fff",
            ],
            "it": [
                "La barzelletta inoltrata contiene caratteri Unicode non compresi tra 0x0000 e 0x0fff.",
            ],
            "ru": [
                "Представленный анекдот содержит недопустимые символы вне диапазона Юникода от 0x0000 до 0x0fff",
            ],
        },
    },
    "110": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Submission blocked by Rate Limiting",
            "cs": "Podání bylo blokováno omezením míry",
            "de": "Einreichung blockiert durch Ratenbegrenzung",
            "it": "Invio bloccato dal limite di frequenza",
            "ru": "Представление заблокировано ограничением по тарифу",
        },
        "causedBy": {
            "en": [
                `You have sent too many requests too quickly. The limit is ${settings.jokes.submissions.rateLimiting} submissions within ${settings.jokes.submissions.timeFrame} ${settings.jokes.submissions.timeFrame == 1 ? "second" : "seconds"}.\nIf you need to send more requests, please either wait for a bit or contact me and we can try to figure things out: ${settings.info.author.website}`,
            ],
            "cs": [
                `Příliš rychle jste odeslali příliš mnoho žádostí. Limit je ${settings.jokes.submissions.rateLimiting} podání v rámci ${settings.jokes.submissions.timeFrame} ${settings.jokes.submissions.timeFrame == 1 ? "sekunda" : "sekund"}.\nPokud potřebujete poslat více požadavků, počkejte prosím chvilku nebo kontaktujte mě a můžeme se domluvit: ${settings.info.author.website}`,
            ],
            "de": [
                `Du hast zu viele Anfragen zu schnell gesendet. Das Limit ist ${settings.jokes.submissions.rateLimiting} Einreichungen innerhalb von ${settings.jokes.submissions.timeFrame} ${settings.jokes.submissions.timeFrame == 1 ? "Sekunde" : "Sekunden"}.\nWenn du mehr Anfragen pro Minute brauchst, kontaktiere mich bitte, damit wir es klären können: ${settings.info.author.website}`,
            ],
            "it": [
                `Hai inoltrato troppe richieste in poco tempo. Il limite è di ${settings.jokes.submissions.rateLimiting} richieste in ${settings.jokes.submissions.timeFrame} ${settings.jokes.submissions.timeFrame == 1 ? "secondo" : "secondi"}.\nSe hai bisogno di più richieste al minuto, per favore contattami per trovare una risoluzione: ${settings.info.author.website}`,
            ],
            "ru": [
                `Вы отправили слишком много запросов слишком быстро. Лимит - ${settings.jokes.submissions.rateLimiting} представления в пределах ${settings.jokes.submissions.timeFrame} ${settings.jokes.submissions.timeFrame == 1 ? "секунда" : "секунды" }.\nЕсли Вам нужно отправить больше запросов, пожалуйста, либо подождите немного, либо свяжитесь со мной, и мы попробуем разобраться в этом: ${settings.info.author.website}`,
            ],
        },
    },
};
