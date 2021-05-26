# SENG365 2021 Assignment 1

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env`, following the instructions in the section below
3. Create a mariaDB database or similar with the name that you set in the `.env` file
2. Run `npm run start` or `npm run debug` to start the server
3. The server will be accessible on `localhost:4941`

### `.env` file
Create a `.env` file in the root directory of this project including the following information (note that you will need to create the database first in phpMyAdmin):

```
SENG365_MYSQL_HOST={your database url}
SENG365_MYSQL_USER={your username}
SENG365_MYSQL_PASSWORD={your password}
SENG365_MYSQL_DATABASE={your schema}
```

For example:
```
SENG365_MYSQL_HOST=db2.csse.canterbury.ac.nz
SENG365_MYSQL_USER=abc123
SENG365_MYSQL_PASSWORD=password
SENG365_MYSQL_DATABASE=abc123_main
```

## Manual testing, with Postman

There is a Postman collection, in `app/resources/postman`, with request(s) for each endpoint. You can use this to query your application.

To import the collection:
1. Click Import (top left)
2. Click Choose Files
3. Select `Petitions site.postman_collection.json`

To import the environments:
4. Click the gear icon (⚙️)
5. Click Import
6. Click Choose Files
6. Select the three files that end in `.postman_environment.json`
7. Click Petitions: deployed application
8. Change the current value so that it uses your `SENG365_PORT` instead of `4001`
9. Click Update

To choose which application you send your requests to, select the corresponding environment from the dropdown in the top right (by default, it will be "No Environment"). This will set the `BASE_URL` variable.

* "Petitions: deployed application" will use the version of your application that is deployed to the docker container.
* "Petitions: localhost" will use the locally running application (on port 4941).
* "Petitions: reference server" will use the reference server.

To test the PUT photo endpoints, you will need to copy the images in `app/resources/postman/files` into your working directory. By default, this will be `~/Postman/files`, but you can check by clicking the spanner icon in the top right, clicking Settings, the scrolling down to Working Directory.

### How it works: your user ID, token, etc.

Some of the Postman requests, such as POST /users/login, have scripts included, in the Tests tab. These set global variables, such as your user ID and the auth token, which are then used in other requests. For example, `auth_token` is used in the `X-Authorization` header of PATCH /users/:id. The POST /users/logout request then has a script to delete the user ID and token.

## Storing photos

You should set up your application to store files in the `storage/photos` directory; this is where the photos used for the sample data are copied into when you run a `/resample` or `/reload` request. There will initially be a file called `.gitkeep` in there; this is just so that the directory gets included in the git repository (see https://stackoverflow.com/q/7229885/8355496 for more information).

## Running the frontend application
See: https://github.com/amf133/seng365_frontend
