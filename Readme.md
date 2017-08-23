# Identity Desk

Authentication, SSO, user management, and overall identity solution for Node.js

[![Build Status][travis-image]][travis-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/HiFaraz/identity-desk.svg)](https://greenkeeper.io/)

Identity Desk is a flexible identity solution for Node.js. It saves you the effort of building a **complete user system** from various libraries such as Passport. And it is modular, so you can use only what you need.

```javascript
// Load Identity Desk core and plugins
const authentication = require('identity-desk/authentication')
const identityDesk = require('identity-desk')({
  plugins: [authentication]
})

// Attach as Express middleware
app.use(identityDesk.app)

// Protect any route with `req.isAuthenticated`
app.get('/restricted', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Hello world')
  } else {
    res.redirect('/login')
  }
})
```

## Modes

Use Identity Desk in either **embedded** or **hub** mode, depending on your architecture:

| Embedded mode                                                               | Hub mode                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Use Identity Desk as a middleware within a single Express-based application | Use Identity Desk as a standalone single sign-on (SSO) server for use with multiple web applications (even non-Node.js applications) |

## Why Identity Desk?

 - get security updates
 - on-premise & open source
 - maintain control of your user data
 - use security best-practices instantly
 - sensible defaults, customize almost anything
 - save the time and effort of rolling your own identity solution


## Features / Roadmap

### Target for [initial release](https://github.com/HiFaraz/identity-desk/milestone/1)

  - [ ] Authentication
    - [x] Local: username / password
    - [ ] Support for third-party authenticators (similar to Passport strategies)
  - [ ] Configuration panel
  - [ ] Registration
  - [ ] User administration panel

### Beyond initial

  - Authentication
    - Passwordless / magic links
    - LDAP
    - OAuth
    - Social logins
    - Two-factor / multi-factor
    - ... and other authenticators (similar to Passport strategies)
  - Auditing
  - Role-based access control (RBAC)
  - Account linking (e.g. link a Facebook and LinkedIn login to the same account/identity)
  - Password resets and invalidation
  - Single sign-on
  - User on-boarding experience
  - Account locking / anomaly detection
  - Password hash upgrading

## Installation

```bash
$ npm install identity-desk
```

### Dependencies

To use Identity Desk, you will need the following modules installed:

  - `body-parser`
  - [`connect-session-sequelize`] if you plan to store sessions in the database rather than providing a separate session store
  - `express`: `^4.0.0`
  - `express-session`

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## Contributing

This project welcomes contributions from the community. Contributions are
accepted using GitHub pull requests; for more information, see 
[GitHub documentation - Creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

For a good pull request, we ask you provide the following:

1. Include a clear description of your pull request in the description
   with the basic "what" and "why"s for the request.
2. The tests should pass as best as you can. GitHub will automatically run
   the tests as well, to act as a safety net.
3. The pull request should include tests for the change. A new feature should
   have tests for the new feature and bug fixes should include a test that fails
   without the corresponding code change and passes after they are applied.
   The command `npm run test-cov` will generate a `coverage/` folder that
   contains HTML pages of the code coverage, to better understand if everything
   you're adding is being tested.
4. If the pull request is a new feature, please include appropriate documentation 
   in the `README.md` file as well.
5. To help ensure that your code is similar in style to the existing code,
   run the command `npm run lint` and fix any displayed issues.

## Bug reports

Create a [GitHub issue](https://github.com/HiFaraz/identity-desk/issues/new) to report a bug. Please provide sufficient details to reproduce the bug, such as version numbers, error logs, and example code if possible.

If you have discovered a security related bug, please do NOT use the GitHub issue tracker. Send an email to [security@identitydesk.io](mailto:security@identitydesk.io).

## People

The lead author is [Faraz Syed](https://github.com/HiFaraz).

[List of all contributors](https://github.com/HiFaraz/identity-desk/graphs/contributors)

## Support

Create a GitHub issue to ask a question. Make sure to add `[question]` to the beginning of your issue's title.

Commercial support is also available.

  - Consulting (install, config, maintain, upgrade, migrate)
  - Sponsored feature development
  - Training
  - Hosted Identity Desk / SaaS

Commercial support contact: [support@identitydesk.io](mailto:support@identitydesk.io)

## License

[MIT](LICENSE)

[travis-image]: https://travis-ci.org/HiFaraz/identity-desk.svg?branch=master
[travis-url]: https://travis-ci.org/HiFaraz/identity-desk

# Readme TODO

  - Explain Authenticators
  - Explain how to write a plugin, including models
  - List core models in reference