# github-tipbot

A TurtleCoin tipbot for Github built with [Probot](https://github.com/probot/probot)

## Setup

### Configure firebase environment variables

```sh
# Set the following probot variables:
firebase functions:config:set probot.app_id="YOUR GITHUB APP ID"
firebase functions:config:set probot.webhook_secret="YOUR WEBHOOK SECRET"
firebase functions:config:set probot.private_key="YOUR PRIVATE KEY"

# Set the following TRTL Apps variables:
firebase functions:config:set trtl.app_id="YOUR TRTL APP ID"
firebase functions:config:set trtl.app_secret="YOUR TRTL APP SECRET"
```

```sh
# Install dependencies
npm install

# Run with hot reload
npm run build:watch

# Compile and run
npm run build
npm run start
```

## Contributing

If you have suggestions for how github-tipbot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 zoidbergZA <5298218+zoidbergZA@users.noreply.github.com>
