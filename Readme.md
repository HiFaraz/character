# Identity Desk

The [Node.js](http://nodejs.org) identity solution

[![Build Status][travis-image]][travis-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/HiFaraz/identity-desk.svg)](https://greenkeeper.io/)

## Installation

```bash
$ npm install identity-desk
```

## Usage with Express

Identity Desk is compatible with Express 4.x. To use Identity Desk, you will need the following modules installed:

  - `body-parser`
  - [`connect-session-sequelize`] if you plan to store sessions in the database rather than providing a separate session store
  - `express`
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

## People

The lead author is [Faraz Syed](https://github.com/HiFaraz).

[List of all contributors](https://github.com/HiFaraz/identity-desk/graphs/contributors)

## License

[MIT](LICENSE)

[travis-image]: https://travis-ci.org/HiFaraz/identity-desk.svg?branch=master
[travis-url]: https://travis-ci.org/HiFaraz/identity-desk
