# Changeslog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-06

### Changed
- PHP polling plugin uses session-based authentication instead of user keys.
- Client-to-server push uses a direct AJAX endpoint instead of a web service.

### Added
- Setting to allow guest users to subscribe to realtime events.
- Test settings page shows links to plugin settings and management pages.

## [2.0.0] - 2026-02-19

### Changed
- Minimum required Moodle version raised to 4.5.

### Added
- Centrifugo subplugin.
- Test settings page.

### Removed
- Pusher subplugin.
