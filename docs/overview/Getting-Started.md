# Getting Started

## Required knowledge

This guide assumes you are familiar with:
  - Node.js
  - Express

## Installation

```bash
$ npm install identity-desk
```

### Peer dependencies

To use Identity Desk, you will need to install the following modules:

  - `body-parser`
  - [`connect-session-sequelize`] if you plan to store sessions in the database rather than providing a separate session store
  - `express`: `^4.0.0`
  - `express-session`