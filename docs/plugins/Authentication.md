# Authentication

Add authentication to Character

## Introduction

This plugin allows you to protect your application by requiring users to authenticate for chosen routes/endpoints.

Authentication works with session handling using cryptographically signed cookies and allows you to use your own session store.

This plugin simply provides the base layer for authentication. It is meant to be used with "authenticators": modules that connect you to identity providers such as Facebook, Google, or even your own database.

## Installation

This is a built-in plugin and does not need to be installed separately.

## Configuration

Add these properties under `plugins.authentication`:

**authenticatorTargetParameter**

The parameter name used for internal routing. Implemented as either request body property or URL parameter.

The default value is `'character_target'`.

**authenticators**

Authenticators to use and their configuration. See [Authenticators](#authenticators) for details.

**login**

Path to use to redirect failed authentication attempts. This can be overridden at the authenticator level.

The default value is `'/login'`.

**onboardKnownAccounts**

Determines whether to create an identity if an account does not already have one. For example, when a new user authenticates via Facebook there will be no corresponding identity for the Facebook account. If set to `true` this allows the plugin to create a new identity, thereby "onboarding" the account.

The default value is `true`.

**session** (required)

Session configuration. See [Sessions](#sessions) for details.

**successRedirect**

Path to use to redirect successful authentication attempts. This can be overridden at the authenticator level.

The default value is `'/'`.

## API

Attach to Character by adding it to the `plugins` property array:

```javascript
const authentication = require('character/authentication')
const character = require('character')({
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

## How it works

Three layers, post-router middleware for sessions and custom methods

## Authenticators

Example:

```yaml
plugins:
  authentication:
    authenticators:
      local:
        module: character-local
        source: npm
        version: ^0.1.0
        successRedirect: /restricted
```

## Sessions

Authentication uses [`express-sessions`](https://github.com/expressjs/session) for session handling.

The session cookie is called `character.sid` and is created as an HTTP-only cookie.

### Configuring sessions

Add these properties under `plugins.authentication.sessions`:

**cookie**

Cookie options. This is compatible with the `cookie` property from `express-sessions`, with the following exceptions:

  - `cookie.expires` is not allowed
  - `cookie.maxAge` is required and cannot be `null` (TODO implement the null check)
  - `cookie.secure = false` will issue a warning through `console.warn` if `process.env.NODE_ENV === 'production'` (TODO implement this)

**keys**

Secret key for signing sessions. This is compatible with the `secret` property from `express-sessions`, with the following exception: the string value provided to `keys` will be split by commas to create an array.

### Sessions store

Authentication uses the `connect-session-sequelize` store by default to store sessions in the database.

You can use any `express-sessions`-compatible store however. To attach your own store, pass the store as the `sessionStore` dependency to the Authentication plugin:

```javascript
const character = require('character')({
  plugins: [
    [ authentication, { sessionStore: mySessionStore } ],
    // ...
  ]
}
```

## Internal name

The internal name for this plugin is `authentication`.