# Consider

## Screenshot

![Screenshot](https://raw.githubusercontent.com/dittos/consider/master/screenshot.png)

## Build

    cd client
    npm install
    ./node_modules/.bin/webpack
    cd ..
    mvn package

## Run

    ./consider.sh repo-id pull-request-id

    # For example: https://github.com/dittos/consider/pulls/1234
    # ./consider.sh dittos/consider 1234
