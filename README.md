# TurtleCoin Tips

A TurtleCoin tips service.

## Setup

### Create the app config

In firestore create a document at the location: `globals/config`

Set a property named `tipTimeoutDays` (number) to the amount of days an unclaimed tip has before the sender will be refunded. A number lower than 1 means there will be no timeout for unclaimed tips.

### Configure firebase environment variables

```sh
# Set the following Github probot variables:
firebase functions:config:set probot.app_id="YOUR GITHUB APP ID"
firebase functions:config:set probot.webhook_secret="YOUR WEBHOOK SECRET"
firebase functions:config:set probot.private_key="YOUR PRIVATE KEY"

# Set the following TRTL Apps variables:
firebase functions:config:set trtl.app_id="YOUR TRTL APP ID"
firebase functions:config:set trtl.app_secret="YOUR TRTL APP SECRET"
```

## Project structure

The frontend React app can be found in the `/frontend` folder.

The backend code is located in the `/functions` folder.

## CI/CD

The project uses Github actions to build and deploy on pushes to the `master` branch. This requires to following Github secret to be set in `settings -> secrets`:

key: `FIREBASE_TOKEN`

value: `YOUR_FIREBASE_TOKEN` (run firebase login:ci in the project folder to get your token)

## Development

See the `frontend/README.md` for details on how to build, test and deploy the frontend app.

### Updating firestore indexes

If you have updated the firestore indexes it is important to also add the changes to source control. In the firebase CLI, run `firebase firestore:indexes` to get the JSON, then overwrite the content of the `firestore.indexes.json` file in the root of the project folder.

### Updating firestore security rules

If you have updated the firestore rules it is important to also add the changes to source control. In the firebase console, copy the rules text and overwrite the content of the `firestore.rules` file in the root folder of the project.

## License

[ISC](LICENSE) © 2020 zoidbergZA <5298218+zoidbergZA@users.noreply.github.com>
