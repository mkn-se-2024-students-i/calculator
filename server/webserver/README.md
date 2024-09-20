# Setup webserver

1. Rename `Secrets.js` to `secrets.js`
1. Set the following two values to IP address of the host:

    1. value of `ip` in `secrets.js`
    1. value of GitHub repository secret `WEBSERVER_IP`

1. Set the following two values to TCP port of the host:

    1. value of `port` in `secrets.js`
    2. value of GitHub repository secret `WEBSERVER_PORT`

1. Set the following two values to randomly generated string:

    1. value of `publishReleaseString` in `secrets.js`
    1. value of GitHub repository secret `WEBSERVER_RELEASE`
