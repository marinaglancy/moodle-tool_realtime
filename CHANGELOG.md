# Changeslog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Support for Moodle 5.2 and 5.3.

### Fixed
- Centrifugo backend no longer breaks the site administration pages in Moodle 5.3.
- Centrifugo backend now respects the "Allow guest users" setting. Previously guests could
  connect and receive real-time events even when this setting was disabled.
- A slow or unreachable Centrifugo server no longer makes page requests hang or fail
  when real-time events are sent.
- Centrifugo backend no longer reports a lost connection several times on pages with multiple subscriptions.
- PHP polling "Check interval" setting only accepts numbers. Other values broke pages that use real-time events.

## [2.1.1] - 2026-03-06

### Fixed
- Recompiled stale JS files for phppoll.

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
