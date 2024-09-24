# Setup webserver

1. Copy `Secrets.js` to `secrets.js`
1. Set the following two values to IP address of the host:

    1. value of `ip` in `secrets.js`
    1. value of GitHub repository secret `WEBSERVER_IP`

1. Set the following two values to TCP port of the host:

    1. value of `port` in `secrets.js`
    1. value of GitHub repository secret `WEBSERVER_PORT`

1. Set the following two values to randomly generated string:

    1. value of `publishReleaseString` in `secrets.js`
    1. value of GitHub repository secret `WEBSERVER_RELEASE`

1. Run `npm run hot` (or `npm run cold`) to launch the server on the machine (INSECURE, use only in local network for testing).
1. Run `npm run docker:build:hot` (or `npm run docker:build:hot`) to build the docker image and then run `npm run docker` to launch the server in the docker container.
