# JokeAPI v3 Design Document:

<br>

## Table of Contents:
- [Introduction](#introduction)
- [Project Goals](#project-goals)
- [Design requirements](#design-requirements)
<!-- - [Project Structure](#project-structure) -->
- [Database](./database.md)
  - [Schema](./database.md#schema)
  <!-- - [Enums](./database.md#enums) -->
- [HTTP](./http.md)
  - [API Endpoints](./http.md#api-endpoints)
  - [Rate Limiting](./http.md#rate-limiting)
  - [Error Handling](./http.md#error-handling)
  - [Security](./http.md#security)
<!-- - [Testing](#testing) -->
- [Prototyping](#prototyping)
- [Contributing](#contributing)
- [License](#license)

<br><br>

## Introduction:
JokeAPI v3 (also called JAPI) is the in all ways superior successor to JokeAPI v2, a RESTful API that serves jokes in various formats. It is designed to be simple to use and easy to understand.  
This document outlines the goals of the project, the structure of the codebase, and the design of the API.  

<br><br>

## Project Goals:
- **Simplicity:** Easy to use and understand for developers of all skill levels.
- **Uniformity:** Provides a consistent experience across all endpoints.
- **Performance:** Fast and responsive, even under heavy load, since there are many users who rely on it.
- **Reliability:** Stable and reliable, with minimal downtime.
- **Scalability:** Able to scale horizontally to handle increased load.
  - **Containerization:** Able to run in a k8s cluster for easy deployment and scaling.
  - **Load Balancing:** Able to distribute incoming requests across multiple servers.
- **Documentation:** Well-documented, with clear and concise explanations of how to use it and a section for testing the API live.

<br><br>

## Design requirements:
- Frontends
  - Documentation page
    - Shows all available endpoints, each endpoint showing:
      - Required level of authentication
      - Required and optional parameters
      - Example requests & responses
  - Homepage
    - Contains front page content
    - Contains link to documentation in the navbar
    - Has a section for live testing of the API
    - Has a section to search for jokes
    - Has a section for joke submissions
      - Sortable by Latest, Oldest, Most Upvoted, Least Upvoted
      - Filterable by category, type, flags, etc.
      - Searchable by logged in users
    - Has a section for the own account (if logged in)
      - User details
        - Username
        - Email
        - Account tier
      - User settings
        - Notification settings
        - OAuth connections (GitHub, Google, Discord)
        - Toggle connections' public visibility
    - Has a section for managing the account tier
      - Shows current tier, billing cycle, and next billing date
      - Shows past invoices
      - Allows upgrading to Pro or Enterprise
      - Allows downgrading to Pro
      - Allows canceling subscription (downgrading to Free)
- User accounts
  - API key
    - Safe generation & storage as salted hash
    - Revocation & regeneration by user
  - User account tiers
    - Guest
      - Without sign-up and API key
      - Price: $0
      - Ads are shown on documentation page
      - Read rate limits: 100 / day, 10 / minute
      - Writing is not allowed
    - Free
      - Authenticated via API key
      - Price: $0
      - Ads are shown on documentation page
      - Read rate limits: 300 / day, 30 / minute
      - Write rate limits: 8 / day, 2 / minute
    - Pro
      - Authenticated via API key
      - Price: $5 / month
      - No ads
      - Boosted submission priority
      - Read rate limits: 25000 / day, 300 / minute
      - Write rate limits: 50 / day
    - Enterprise
      - Authenticated via API key
      - Price: $50 / month
      - No ads
      - Boosted submission priority
      - Priority support
      - Read rate limits: 500000 / day, 5000 / minute
      - Write rate limits: 1000 / day
  - Email notification settings
    - For API update announcements
    - For joke acceptance & rejection
    - For joke edit proposal submission & acceptance
- Jokes
  - Submission
    - Jokes can be submitted by authenticated users (free, pro, enterprise)
    - Submissions are always public for full transparency, until accepted or deleted
    - Submissions can be deleted by the user who submitted them or by moderators
    - Submissions must be accepted by moderators before being added to the pool of served jokes
    - Submissions must have an associated language or locale  
      For example, `en` would be available to all english locales like `en-US`, `en-GB`, etc. while `en-US` would only be available when the language filter is set to `en-US`
    - Voting by authenticated users (free, pro, enterprise)
      - Upvote or downvote submissions
      - Report submissions
      - Recreate a submission  
        If a user deems a submission to be wrong in its content or attributes, they can recreate it with the correct data.  
        This recreated submission links back to the original submission for moderation purposes.
  - Joke deletion
    - Jokes can be marked as deleted by moderators
    - Deleted jokes are not returned by the regular endpoints
    - After a period of time passed, deleted jokes are permanently removed from the database
  - Moderator abilities
    - Editing jokes
    - Accepting submissions
    - Deleting submissions
  - Dev abilities
    - Deleting jokes
- HTTP
  - REST API
    - Consistent format for all endpoints
  - Rate limiting
    - Dynamic rate limits in the API itself by resolving user tier from the given API key
    - Broad rate limit defined in nginx
  - Error handling
    - Consistent error object format
    - `error` bool property is always present
    - `message` string prop for human-readable error messages
    - `details` string array prop for additional error details
  - Stack
    - express
    - helmet
    - cors
    - compression
- Database
  - MikroORM as the ORM
  - PostgreSQL as the database
  - Redundancy through cold standby (all writes get replicated to the standby, which takes over in a failure)
  - Data synchronization: TODO
- Testing
  - Unit tests: TODO
- DX
  - Docusaurus for easy documentation with MD & MDX
  - ESLint for linting and auto-fixing
- Deployment
  - Automatic prod deployment on release creation with GH Actions
  - Automatic stage deployment on push to `dev` branch
  - Deployment on a k8s cluster
  - Load balancing with k8s ingress
  - Horizontal scaling with k8s HPA
  - Persistent storage with k8s PVC
    - Postgres data lives in a PVC
  - Secrets management with k8s secrets

<br><br>

## Prototyping:
Certain features will need prototyping to ensure they can be implemented as intended:
- Server
  - [ ] TLS end-to-end encryption
  - [ ] Generic data validation and sanitization
- User accounts and authentication
  - [ ] IAM system with OAuth connections
  - [ ] User account tier management and automatic billing
  - [ ] Mass Email notifications
- Deployment
  - [ ] Automatic k8s deployments via GH Actions
  - [ ] k8s clustering and load balancing
  - [ ] Distributed postgres data storage and synchronization / write duplication
