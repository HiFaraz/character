# Character

Authentication, SSO, user management, and overall identity solution for Node.js

[![Build Status][travis-image]][travis-url]

Character is a turnkey solution that makes it faster, easier, and cheaper to add a **complete user system** for your applications:

  - authentication
  - SSO
  - system administration
  - user management
  - [and more ...](#features--roadmap)

You don't have to use all the features. Character is **modular**, so you can use only the features you need.

## Getting started

### Installing

Install Character from `npm`:

```bash
$ npm install character
```

You also need to install the [peer dependencies](docs/guides/Getting-Started.md#installation).

### Usage

Character exports an Express Router which can be mounted onto any Express 4.x app with `app.use`. This is a clean mount which does not interfere with existing routes, because almost all middleware is mounted under `/auth` (configurable).

It reads its configuration from `character.yml` by default (configurable).

Here is example usage from the [Local authenticator example](examples/local):

```javascript
// Load Character core and plugins
const character = require('character')()
const authentication = require('character/authentication')

character.use(authentication);

// Attach as Express middleware
app.use(character.create())

// Protect any route with `req.isAuthenticated`
app.get('/restricted', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Hello world')
  } else {
    res.redirect('/login')
  }
})
```

Note how `authentication` was added as a plugin. The modular nature of Character makes it easy to build a custom identity solution.

## Documentation

  - [Overview](docs/README.md)
  - [Examples](examples)
    - [Local authentication](examples/local) (username + password)

## Why Character?

Presently there are two main options for building Node.js applications:

  - build and support a custom solution with a low-level library, e.g. Passport
  - use a commercial service, e.g. Auth0

Character combines the key benefits of both options. Install it on your own server and keep control of your own data!

| Benefit                                                            | Custom solution | Character | Commercial service |
| ------------------------------------------------------------------ | --------------- | --------- | ------------------ |
| Save R&D time and money with a pre-built solution                  |                 | ✅         | ✅                  |
| Secure your applications with best-practices and security updates  |                 | ✅         | ✅                  |
| Protect against known vulnerabilities                              |                 | ✅         | ✅                  |
| Use a security-audited and penetration-tested solution             |                 | (planned) | ❔                  |
| On-premise: comply with your enterprise security requirements      | ✅               | ✅         | ❔                  |
| Open source: verify the code that handles your user data           | ✅               | ✅         |                    |
| Keep your user data our of third-party hands                       | ✅               | ✅         |                    |
| Avoid costly service fees (e.g. for registered but inactive users) | ✅               | ✅         |                    |
| Avoid complicated licensing fee structures                         | ✅               | ✅         |                    |

## Features / Roadmap

### Target for [initial release](https://github.com/HiFaraz/character/milestone/1)

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

## Bug reports and security disclosures

Create a [GitHub issue](https://github.com/HiFaraz/character/issues/new) to report a bug. Please provide sufficient details to reproduce the bug, such as version numbers, error logs, and example code if possible.

If you have discovered a security related bug, please do NOT use the GitHub issue tracker. Send an email to [security@characterjs.com](mailto:security@characterjs.com).

## People

The lead author is [Faraz Syed](https://github.com/HiFaraz).

[List of all contributors](https://github.com/HiFaraz/character/graphs/contributors)

## Support

Create a GitHub issue to ask a question. Make sure to add `[question]` to the beginning of your issue's title.

Commercial support is also available:

  - Consulting (install, config, maintain, upgrade, migrate)
  - Sponsored feature development
  - Training
  - Future: Hosted Character / SaaS

Commercial support contact: [support@characterjs.com](mailto:support@characterjs.com)

## License

[MIT](LICENSE)

[travis-image]: https://travis-ci.org/HiFaraz/character.svg?branch=master
[travis-url]: https://travis-ci.org/HiFaraz/character