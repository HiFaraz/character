# Authentication

Add authentication to Identity Desk

## Features

  - authentication
  - account on-boarding/registration
  - session handling
  - define your own session store

## Installation

This is a built-in plugin and does not need to be installed separately.

## API

Attach to Identity Desk by adding it to the `plugins` property array:

```javascript
const authentication = require('identity-desk/authentication')
const identityDesk = require('identity-desk')({
  plugins: [
    authentication,
    // ...
  ]
})
```

Protect routes with the `req.isAuthenticated` method

```javascript
app.get('/restricted', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Hello world')
  } else {
    res.redirect('/login')
  }
})
```

### Configuration

Add all plugin configuration under `plugins.authentication` in your configuration file. See [Authenticators](#authenticators) and [Session handling](#session-handling) for configuration properties.

## How it works

Three layers, post-router middleware for sessions and custom methods

## Authenticators

Example:

```yaml
plugins:
  authentication:
    authenticators:
      local:
        module: identity-desk-local
        source: npm
        version: ^0.1.0
        successRedirect: /restricted
```

## Session handling

Authentication uses [`express-sessions`](https://github.com/expressjs/session) for session handling.

The session cookie is called `identityDesk.sid` and is created as an HTTP-only cookie.

Session configuration is stored under `plugins.authentication.sessions` in your configuration file.

### Required properties

**cookie**

This is the `cookie` property from `express-sessions`, with the following exceptions:

  - `cookie.expires` is not allowed
  - `cookie.maxAge` is required and cannot be `null` (TODO implement the null check)
  - `cookie.secure = false` will issue a warning through `console.warn` if `process.env.NODE_ENV === 'production'` (TODO implement this)

**keys**

This is the `secret` property from `express-sessions`, with the following exception: the string value provided to `keys` will be split by commas to create an array.

### Sessions store

Authentication uses the `connect-session-sequelize` store by default to store sessions in the database.

You can use any `express-sessions`-compatible store however. To attach your own store, pass the store as the `sessionStore` dependency to the Authentication plugin:

```javascript
const identityDesk = require('identity-desk')({
  plugins: [
    [ authentication, { sessionStore: mySessionStore } ],
    // ...
  ]
}
```

## Internal name

The internal name for this plugin is `authentication`.

TODO add a link explaining internal names.