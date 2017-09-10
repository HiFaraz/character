# Identity Desk documentation

Everything you need to know about Identity Desk

## Contents

  - [Overview](overview)
    - [Getting Started](overview/Getting-Started.md)
    - [Using Plugins](Using-Plugins.md)
  - [Examples](../examples)
    - [Local authentication](../examples/local) (username + password)
  - [Plugins](plugins)
    - Auditing
    - [Authentication](plugins/Authentication.md)
    - Configuration GUI
    - Role-based access control (RBAC)
    - User administration/management GUI
    - [Developing Custom Plugins](plugins/Developing-Custom-Plugins.md)

## Getting started

If you're new to Identity Desk, read the [Getting Started](overview/Getting-Started.md) guide.

## Example applications

These applications demonstrate different ways of using Identity Desk:

  - [Local authentication](../examples/local) (username + password)

## Plugins

Identity Desk provides features as separate modules called "plugins". This allows you to only use the features you need. You can use both built-in and custom plugins.

The following plugins are built-in and do not need to be installed separately:

  - Auditing
  - [Authentication](plugins/Authentication.md)
  - Configuration GUI
  - Role-based access control (RBAC)
  - User administration/management GUI

### Authentication and Authenticators

`Authentication`

### Developing custom plugins

Identity Desk exposes a standard plugin API to support custom plugins. Read the [Developing Custom Plugins](plugins/Developing-Custom-Plugins.md) guide to learn more.