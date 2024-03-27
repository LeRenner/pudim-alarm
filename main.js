const fs = require('fs');
// node fetch
const fetch = require('node-fetch');

let pudimBlocked = false;
let jellyfinBlocked = false;

// read telegram secret json from (from root) /secrets/telegram.json
const telegramSecrets = JSON.parse(fs.readFileSync('/secrets/telegram.json', 'utf8'));

// anonymous function to send message
const sendMessage = (chatId, message) => {
	console.error(`Sending message to ${chatId}: ${message}`);

	// send post request to send message on telegram
	fetch(`https://api.telegram.org/${telegramSecrets.token}/sendMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: message
		})
	})
		.then(data => {
			console.error('Message sent');
			console.error(data);
		})
		.catch(error => {
			console.error('Error sending message');
			console.error(error);
		});
}

const alert = (service, good) => {
	if (service === 'Pudim' && !good && !pudimBlocked) {
		console.error("Sending error message about " + service);
		pudimBlocked = true;
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is down: ' + service);

		// unblock in an hour
		setTimeout(() => {
			pudimBlocked = false;
		}, 1800000);
	} else if (service === 'Pudim' && good) {
		console.error("Sending success message about " + service);
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is back up: ' + service);
	} else if (service === 'Jellyfin' && !good && !jellyfinBlocked) {
		console.error("Sending error message about " + service);
		jellyfinBlocked = true;
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is down: ' + service);

		// unblock in an hour
		setTimeout(() => {
			jellyfinBlocked = false;
		}, 1800000);
	} else if (service === 'Jellyfin' && good) {
		console.error("Sending success message about " + service);
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is back up: ' + service);
	}
}

const checkPudim = () => {
	// stderr output
	console.error('Checking pudim...');

	// get request to https://pudim.xyz and check if second line starts with "Yes"
	fetch('https://pudim.xyz')
		.then(response => response.text())
		.then(body => {
			const lines = body.split('\n');
			if (!lines[1].startsWith('Yes')) {
				alert("Pudim", false);
			} else if (lines[1].startsWith('Yes') && pudimBlocked) {
				alert("Pudim", true)
				pudimBlocked = false
			}
		})
		.catch(error=> {
			alert("Pudim", false);
		});

}

const checkJellyfin = () => {
	console.error('Checking jellyfin...');

	// get request to https://jelly.pudim.xyz/health and check if response is "Healthy"
	fetch('https://jelly.pudim.xyz/health')
		.then(response => response.text())
		.then(body => {
			if (body !== 'Healthy') {
				alert("Jellyfin", false);
			} else if (body == "Healthy" && jellyfinBlocked) {
				alert("Jellyfin", true)
				jellyfinBlocked = false
			}
		})
		.catch(error=> {
			alert("Jellyfin", false);
		});
}

const checkAllServices = () => {
	checkPudim();
	checkJellyfin();
}

// run every 10 minutes
setInterval(checkAllServices, 30000);
