Third party libraries used in realtimeplugin_centrifugo
=========================================================================================

Moodle maintainers: Marina Glancy

1. phpcent (PHP)
=========================================================================================

License: MIT
Source: https://github.com/centrifugal/phpcent

This library can be installed using the following composer command in the centrifugo
subplugin root directory:

    composer require centrifugal/phpcent

2. centrifuge-js (JavaScript)
=========================================================================================

License: MIT
Source: https://github.com/centrifugal/centrifuge-js

To update the JavaScript client library:

    git clone https://github.com/centrifugal/centrifuge-js.git /tmp/centrifuge-js
    cd /tmp/centrifuge-js
    git checkout $(git tag --sort=-v:refname | head -1)
    npm install
    npm run build
    cp build/index.mjs /path/to/plugin/amd/src/centrifuge-lazy.js

Then from the Moodle root directory, rebuild the AMD module:

    npx grunt amd --root=admin/tool/realtime/plugin/centrifugo

Update the version number in thirdpartylibs.xml to match the tag.