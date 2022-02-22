const sqlite3 = require('sqlite3').verbose();
const osa = require('osa2')

let LAST_SEEN_ID = 0
const INTERVAL = 10000
const BASE_URL = process.env.BASE_URL
const MESSAGE_MUST_CONTAIN = process.env.MESSAGE_MUST_CONTAIN ? process.env.MESSAGE_MUST_CONTAIN.split(`,`) : []

const file = process.env.HOME + '/Library/Messages/chat.db';
const db = new sqlite3.Database(file);

function checkMessageText(messageId) {
	const SQL = `
        SELECT DISTINCT
            message.ROWID,
            handle.id,
            message.text,
            message.is_from_me,
            message.date,
            message.date_delivered,
            message.date_read,
            chat.chat_identifier,
            chat.display_name
        FROM
            message
        LEFT OUTER JOIN 
            chat 
        ON
            chat.room_name = message.cache_roomnames
        LEFT OUTER JOIN
            handle
        ON
            handle.ROWID = message.handle_id
        WHERE
            message.service = 'SMS'
        AND
            message.ROWID = "${messageId}"
        ORDER BY
            message.date
        DESC LIMIT 500`;

	db.serialize(function() {

        var arr = [];

        db.all(SQL, function(err, rows) {

            if (err) throw err;

			// should only be one result since we are selecting by id but I am looping anyways
			for (const row of rows) {

				console.log(row);

                if (row.is_from_me || !row || !row.text) {

                    return;
				}

				const rowText = row.text;

                for (const mustContainString of MESSAGE_MUST_CONTAIN) {

                    if (!rowText.includes(mustContainString)) {

                        console.log(`${rowText} did not contain ${mustContainString}, abort`)

                        return
                    }
                }

                const alertId = rowText.split(BASE_URL)[1].split(` `)[0] // for some reason I get a " ." at the end of the strings

                sendMessage(row.id, `ACK ${alertId}`)
			}
		});
	});
}

let messageCache = {}

// iMessage;-;${selectedChatId}
const sendMessage = (SELECTED_CHATTER, message) => {

    if (messageCache[message]) {

        console.log(`${message} already sent, abort`)

        return
    }

    messageCache[message] = true

    SELECTED_CHATTER = `SMS;-;${SELECTED_CHATTER}`

    console.log(SELECTED_CHATTER)

	return new Promise(async (resolve, reject) => {

		const osaFunction = (SELECTED_CHATTER, message) => {

			const Messages = Application('Messages')
			let target
	
			try {

				target = Messages.chats.whose({ id: SELECTED_CHATTER })[0]
			} catch (e) {

                console.log(`error retrieving target`)
				console.log(e)
			}
	
			try {

				Messages.send(message, { to: target })
			} catch (e) {

                console.log(`error sending message`)
				console.log(e)
			}

			return {}
		}

		return osa(osaFunction)(SELECTED_CHATTER, message).then(resolve)
	})
}

db.serialize(function() {

	db.all("SELECT MAX(ROWID) AS max FROM message", function(err, rows) {

        if (rows) {

            const max = rows[0].max;

            if (max > LAST_SEEN_ID) {

				LAST_SEEN_ID = max;

                return;
			}
		}
	});
});

setInterval(function() {

	db.serialize(function() {

        db.all("SELECT MAX(ROWID) AS max FROM message", function(err, rows) {

            if (rows) {

                const max = rows[0].max;
				if (max > LAST_SEEN_ID) {

					for (LAST_SEEN_ID; LAST_SEEN_ID <= max; LAST_SEEN_ID++) {

                        checkMessageText(LAST_SEEN_ID);
					}
				}
			}
		});
	});
}, INTERVAL);