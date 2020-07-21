# github-tipbot

A TurtleCoin tipbot for Github built with [Probot](https://github.com/probot/probot)

## Setup

### Create the app config

In firestore create a document at the location: `globals/config`

Set a property named `tipTimeoutDays` (number) to the amount of days an unclaimed tip has before the sender will be refunded. A number lower than 1 means there will be no timeout for unclaimed tips.

### Configure firebase environment variables

```sh
# Set the following probot variables:
firebase functions:config:set probot.app_id="YOUR GITHUB APP ID"
firebase functions:config:set probot.webhook_secret="YOUR WEBHOOK SECRET"
firebase functions:config:set probot.private_key="YOUR PRIVATE KEY"

# Set the following TRTL Apps variables:
firebase functions:config:set trtl.app_id="YOUR TRTL APP ID"
firebase functions:config:set trtl.app_secret="YOUR TRTL APP SECRET"

# Set the frontend url variable:
firebase functions:config:set frontend.url="https://example.com"
```

## Project structure

The tip bot frontend React app can be found in the `/frontend` folder.

The backend code is located in the `/functions` folder.

## Contributing

If you have suggestions for how github-tipbot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 zoidbergZA <5298218+zoidbergZA@users.noreply.github.com>
