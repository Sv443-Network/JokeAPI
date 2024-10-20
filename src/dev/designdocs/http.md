# HTTP

## Authentication
Authentication is done via an API key, generated on registration or by manually regenerating it.  
  
Authentication tiers:
- 🔓G - Not Authenticated - Guest tier
- 🔒F - Authenticated - Free tier
- 🔒P - Authenticated - Pro or Enterprise tier
- ⭐M - Authenticated - Moderator
- ⭐A - Authenticated - Admin
- 🏷️ - Authenticated - Created and possessed by a user

<br>

## API Endpoints
- Jokes
  - `GET /jokes`  
    Returns a list of jokes, randomly selected and matching the query parameters.  
    Params:  
      - `[format]` - one of `json`, `xml`, `txt` - default: `json`
      - `[locale]` - any resolvable locale code or a list of them (e.g. `en`, `en-GB`, ...) - default: `en` - exclusions not allowed
      - 🔒F `[types]` - one of `single`, `multipart` - default: any
      - 🔒F `[categories]` - any joke category or a list of them - default: none - if prefixed with `!`, the category is excluded
      - 🔒F `[flags]` - any flag - default: none - if prefixed with `!`, the flag is excluded
      - 🔒P `[contains]` - any search query - default: none
      - `[limit]` - 🔓G `1`, 🔒F `1..5`, 🔒P `1..25` - default: `..5`
  - `GET /joke`  
    Returns a single joke, randomly selected and matching the query parameters.  
    Params are the same as for `/jokes`, minus `limit`.
  - `GET /joke/:jid`  
    Returns a single joke by its ID.  
    Params:  
      - `[format]` - one of `json`, `xml`, `txt` - default: `json`
  - `PUT /joke/:jid` - ⭐M  
    Updates a joke by its ID.  
    Body needs to contain the new joke data.
  - `DELETE /joke/:jid` - ⭐M  
    Marks a joke as deleted, given its ID.
- Submissions
  - `GET /submissions` - 🔒F  
    Returns a list of submissions, matching the query parameters.  
    Accepted and rejected submissions are marked as deleted and are only available to the author and moderators.  
    Params:  
      - `[locale]` - any resolvable locale code or a list of them (e.g. `en`, `en-GB`, ...) - default: `en` - exclusions not allowed
      - `[status]` - one of `pending`, 🏷️ ⭐M `accepted`, 🏷️ ⭐M `rejected` - default: `pending`
      - `[types]` - one of `single`, `multipart` - default: any
      - `[categories]` - any joke category or a list of them - default: none - if prefixed with `!`, the category is excluded
      - `[flags]` - any flag - default: none - if prefixed with `!`, the flag is excluded
      - 🔒P `[contains]` - any search query - default: none
      - `[author]` - author's ID
      - `[recreationOf]` - base submission's ID
      - 🏷️ ⭐M `[deleted]` - one of `true`, `false` - default: any
      - `[limit]` - `1..25` - default: `25`
      - `[sort]` - one of `hot` (many upvotes in a short time), `date`, `votes` - default: `hot`
      - `[order]` - one of `asc`, `desc` - default: `desc`
      - `[page]` - `0..` - default: `0`
  - `GET /submission/:sid` - 🔒F  
    Returns a single submission by its ID.
  - `POST /submission` - 🔒F  
    Submits a new joke.  
    Body needs to contain the submission data.
  - `PUT /submission/:sid` - 🔒F 🏷️ ⭐M  
    Updates a submission by its ID.  
    Body needs to contain the new submission data.
  - `DELETE /submission/:sid` - ⭐M  
    Marks a submission as deleted, given its ID.
- Users
  - Registration
    - `POST /user` - 🔓G  
      Registers a new user.  
      Body needs to contain the user data.
    - `DELETE /user/:id` - 🏷️ ⭐M  
      Marks a user as deleted, given the user ID.
  - User Info
    - `GET /user/:uid/info` - 🏷️ ⭐M  
      Returns a user's basic attributes, including private information, by the user ID.
    - `PUT /user/:uid/info` - 🏷️ ⭐M  
      Updates a user's basic attributes, including private information, by the user ID.  
      Body needs to contain the new user data.
    - `GET /user/:uid/info/public` - 🔒F  
      Returns a user's basic attributes that are publicly accessible, by the user ID.
    - `PUT /user/:uid/roles` - ⭐A  
      Updates a user's roles by the user ID.  
      Body needs to contain the new roles data.
  - Billing
    - `GET /user/:uid/billing` - 🏷️  
      Returns a user's billing information by the user ID.
    - `PUT /user/:uid/billing` - 🏷️  
      Updates a user's billing information by the user ID.  
      Body needs to contain the new billing data.
    - `DELETE /user/:uid/billing` - 🏷️  
      Deletes a user's billing information by the user ID.
    - `GET /user/:uid/tier` - 🏷️ ⭐M  
      Returns a user's tier by the user ID.
    - `PUT /user/:uid/tier` - ⭐M
      Updates a user's tier by the user ID.  
      Only available if billing info is present.  
      Body needs to contain the new tier data.
  - API Key
    - `POST /user/:uid/apikey` - 🏷️ ⭐M  
      Regenerates a user's API key by the user ID.
  - Settings
    - `GET /user/:uid/notifications` - 🏷️ ⭐M  
      Returns a user's notification settings by the user ID.
    - `PUT /user/:uid/notifications` - 🏷️ ⭐M  
      Updates a user's notification settings by the user ID.  
      Body needs to contain the new notification settings.
    - `GET /user/:uid/connections` - 🏷️ ⭐M  
      Returns a user's OAuth connections by the user ID.
    - `GET /user/:uid/connections/public` - 🔒F  
      Returns a user's OAuth connections that are publicly accessible, by the user ID.
    - `GET /user/:uid/connection/:cid` - 🏷️ ⭐M  
      Returns a user's OAuth connection by the user ID and connection ID.
    - `PUT /user/:uid/connection/:cid` - 🏷️ ⭐M  
      Updates a user's OAuth connection by the user ID and connection ID.  
      Body needs to contain the new connection data.
    - `DELETE /user/:uid/connection/:cid` - 🏷️ ⭐M  
      Deletes a user's OAuth connection by the user ID and connection ID.
  - Reports
    - `GET /user/:uid/reports` - 🏷️ ⭐M  
      Returns a list of user reports by a user ID.
    - `POST /user/:uid/report` - 🔒F  
      Submits a new user report.  
      Body needs to contain the report data.
- Reports (for moderation)
  - `GET /reports` - ⭐M  
    Returns a list of reports, matching the query parameters.  
    Params:  
      - `[viewed]` - one of `true`, `false` - default: `false`
      - `[type]` - one of `joke`, `submission`, `user` - default: `joke`
      - `[limit]` - `1..25` - default: `25`
      - `[deleted]` - one of `true`, `false` - default: `false`
      - `[sort]` - one of `date`, `username` - default: `date`
      - `[order]` - one of `asc`, `desc` - default: `desc`
      - `[page]` - `0..` - default: `0`
    - `GET /report/:rid` - ⭐M  
      Returns a single report by its ID, including all moderator notes.
    - `DELETE /report/:rid` - ⭐M  
      Marks a report and its notes as deleted, given its ID.
    - `POST /report/:rid/notes` - ⭐M  
      Adds a moderator note to a report by its ID.  
      Body needs to contain the note data.
    - `PUT /report/:rid/note/:nid` - 🏷️  
      Updates a moderator note by its ID and note ID.  
      Body needs to contain the new note data.

<br>

## Rate Limiting
A coarse rate limiter is built into the infrastructure via k8s or nginx, with the following limit:  
TODO  
  
A fine rate limiter is built into the server, which gets its limits from the user's tier:  
- Guest
  - Read rate limits: 100 / day, 10 / minute
  - Writing is not allowed
- Free
  - Read rate limits: 300 / day, 30 / minute
  - Write rate limits: 8 / day, 2 / minute
- Pro
  - Read rate limits: 25000 / day, 300 / minute
  - Write rate limits: 50 / day
- Enterprise
  - Read rate limits: 500000 / day, 5000 / minute
  - Write rate limits: 1000 / day

<br>

## Error Handling
Errors are returned in the following format:  
```json
{
  "error": true, // always present, error or not
  "code": 123,
  "message": "Generalized error message / title",
  "details": "Detailed error message"
}
```

<br>

## Security
- Traffic is encrypted all the way through using TLS.  
- API keys are stored hashed and salted.
- The express server uses Helmet for basic security headers.
- Headers:
  - Content-Security-Policy
  - X-XSS-Protection
