# Identity Desk

Authentication, SSO, user management, and overall identity solution for Node.js

[![Build Status][travis-image]][travis-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/HiFaraz/identity-desk.svg)](https://greenkeeper.io/)

Identity Desk makes it faster, easier, and cheaper to add a **complete user system** for your applications. Just install a few modules to gain:

  - authentication
  - SSO
  - system administration
  - user management
  - [and more ...](#features--roadmap)

Identity Desk bridges the gap between building your own identity solution (often with lower-level libraries such as Passport) and relying on commercial services such as Auth0. Install it on your own server and keep control of your own data!

Best of all, Identity Desk is modular, so you can use only what you need.

## Getting started

Here is a snippet that shows how to attach Identity Desk to your application:

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

Note how authentication was added as a plugin. The modular nature of Identity Desk makes it easy to build a custom identity solution.

Be sure to [install Identity Desk and its dependencies](#installation)

Complete examples:

  - [Local authentication](examples/local) (username + password)

## The business case for Identity Desk

Identity Desk combines several benefits of both custom development and commercial identity services:

| Benefit                                                                             | Custom solution (e.g. Passport) | Identity Desk             | Commercial identity service (e.g. Auth0) |
| ----------------------------------------------------------------------------------- | ------------------------------- | ------------------------- | ---------------------------------------- |
| **Business benefits**                                                               |                                 |                           |                                          |
| Pre-built solution: save time and money in R&D                                      |                                 | ✅                         | ✅                                        |
| **Security benefits**                                                               |                                 |                           |                                          |
| On-premise: comply with your enterprise security requirements                       |                                 | ✅                         | ❔                                        |
| Use security best-practices instantly                                               |                                 | ✅                         | ✅                                        |
| Get security updates whenever a patch is released                                   |                                 | ✅                         | ✅                                        |
| Avoid exposure to accidental vulnerabilities (e.g. not hashing passwords correctly) |                                 | ✅                         | ✅                                        |
| Use a security-audited and penetration-tested identity solution                     |                                 | (pending initial release) | ❔                                        |
| Open source: verify the code that handles your user data                            | ✅                               | ✅                         |                                          |
| Open source: verify the code that handles your user data                            | ✅                               | ✅                         |                                          |
| Avoid exposing your user data to third parties                                      | ✅                               | ✅                         |                                          |
| Avoid costly service fees (e.g. for registered inactive users)                      | ✅                               | ✅                         |                                          |
| Avoid complicated licensing fee structures                                          | ✅                               | ✅                         |                                          |

## Features / Roadmap

### Target for [initial release](https://github.com/HiFaraz/identity-desk/milestone/1)

  - [ ] Authentication
    - [x] Local: username / password
    - [ ] Support for third-party authenticators (similar to Passport strategies)
  - [ ] Configuration panel
  - [ ] Registration
  - [ ] User administration panel

### Beyond initial release

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
  - Honeypots
  - Password hash upgrading

## Installation

```bash
$ npm install identity-desk
```

### Peer dependencies

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
4. If the pull request is a new feature, please include appropriate documentation 
   in the `Readme.md` file as well.
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

Commercial support is also available:

  - Consulting (install, config, maintain, upgrade, migrate)
  - Sponsored feature development
  - Training
  - Future: Hosted Identity Desk / SaaS

Commercial support contact: [support@identitydesk.io](mailto:support@identitydesk.io)

## License

[MIT](LICENSE)

[travis-image]: https://travis-ci.org/HiFaraz/identity-desk.svg?branch=master
[travis-url]: https://travis-ci.org/HiFaraz/identity-desk