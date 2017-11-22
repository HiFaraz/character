# Getting Started

## Required knowledge

This guide assumes you are familiar with:
  - Node.js
  - Express

## Overview

These are the high-level steps to using Identity Desk:

  - Install Identity Desk
  - Decide which authenticators to use
  - Define your configuration
  - Attach Identity Desk to your server

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


Configuration file
Config validators
Plugin defaults and validators

## Configuration

`config` option when declaring can either be the relative path to a file or a config object

Default config file name is `identity-desk.yml`