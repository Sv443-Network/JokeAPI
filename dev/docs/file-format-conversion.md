[<< Home](./home.md#readme)
# File Format Conversion
JokeAPI offers the response data in several different formats.  
Internally, everything is being passed around as JSON and only at the last stage before sending the response, the data is converted.  
The central points that define the file formats are `settings.jokes.possible.formats` and the file at `settings.jokes.fileFormatsPath`.  
The file formats file is used to assign additional info to the formats (like the MIME type).  
  
Responsible for conversion is the `fileFormatConverter.js` module.  
It exports a few functions to convert JSON data into the other formats, and it offers the `auto()` function, which converts based on a passed `format` parameter.

| Format | Name | MIME Type | Exported Function |
| --- | --- | --- | --- |
| `json` | JSON | `application/json` | none |
| `xml` | XML | `application/xml` | `toXML()` |
| `yaml` | YAML | `application/x-yaml` | `toYAML()` |
| `txt` | Plain Text | `text/plain` | `toTXT()` |

<br>

Conversion is done using these node modules:  
| Format | Module |
| --- | --- |
| `yaml` | [`json-to-pretty-yaml`](https://npmjs.com/package/json-to-pretty-yaml) |
| `xml` | [`js2xmlparser`](https://npmjs.com/package/js2xmlparser) |

<br>

### Plain text conversion:
The conversion to plain text is special, as it isn't automatic.  
In order to have data converted to plain text, a mapping has to be created.  
These are located in the function `toTXT()` of the `fileFormatConverter.js` module.  
If the format of the input JSON object is changed, the mapping has to be changed too.


<br><br><br><br>

[<< Home](./home.md#readme)
