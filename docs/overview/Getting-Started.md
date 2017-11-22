# Getting Started

## Required knowledge

This guide assumes you are familiar with:
  - Node.js
  - Express

## Overview

These are the high-level steps to using Character:

  - Install Character
  - Decide which authenticators to use
  - Define your configuration
  - Attach Character to your server

## Installation

```bash
$ npm install character
```

### Peer dependencies

To use Character, you will need to install the following modules:

  - `body-parser`
  - [`connect-session-sequelize`] if you plan to store sessions in the database rather than providing a separate session store
  - `express`: `^4.0.0`
  - `express-session`


Configuration file
Config validators
Plugin defaults and validators

## Configuration

`config` option when declaring can either be the relative path to a file or a config object

Default config file name is `character.yml`