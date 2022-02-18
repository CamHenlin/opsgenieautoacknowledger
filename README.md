# OpsGenie Auto Acknowledger

Let's say you're too busy for the alerts, or the alerts won't stop, or people don't care about the alerts, or you don't have time for the alerts or stuff is on fire and you really need a nap. 

I'm not here to judge, I'm here to help. Once installed this script will auto-respond to OpsGenie SMS messages with an ACK command, acknowledging the alert and giving you some peace.

### Requirements

Must run on macOS as it uses the scripting capabilities in Messages.app. Additionally, the Mac must be synced with an iPhone capable of sending SMS messages. (I know...)

### How to run

Just a few easy steps!

- Clone this repo
- Run an `npm install` in the repo's directory
- Run the app with `BASE_URL= MESSAGE_MUST_CONTAIN= node index`, with `BASE_URL` and `MESSAGE_MUST_CONTAIN` set

`BASE_URL` is the URL that this script will look for in the message to extract the OpsGenie Alert ID to acknowledge. This is different for every OpsGenie account.
`MESSAGE_MUST_CONTAIN` is an optional env var that will require that any message that gets responded to contain a specific string. That way if someone is texting you about an alert URL, you don't automatically respond with "ACK alertId"

Enjoy!