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

const alert = (service) => {
	if (service === 'Pudim' && !pudimBlocked) {
		pudimBlocked = true;
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is down: ' + service);

		// unblock in an hour
		setTimeout(() => {
			pudimBlocked = false;
		}, 12000);
	} else if (service === 'Jellyfin' && !jellyfinBlocked) {
		jellyfinBlocked = true;
		sendMessage(telegramSecrets.chatId, '[Backup relay] Service is down: ' + service);

		// unblock in an hour
		setTimeout(() => {
			jellyfinBlocked = false;
		}, 12000);
	}

	sendMessage(telegramSecrets.chatId, '[Backup relay] Service is down: ' + service);
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
				alert("Pudim");
			}
		})
		.catch(error=> {
			alert("Pudim");
		});

}

const checkJellyfin = () => {
	console.error('Checking jellyfin...');

	// get request to https://jelly.pudim.xyz/health and check if response is "Healthy"
	fetch('https://jelly.pudim.xyz/health')
		.then(response => response.text())
		.then(body => {
			if (body !== 'Healthy') {
				alert("Jellyfin");
			}
		})
		.catch(error=> {
			alert("Jellyfin");
		});
}

const checkAllServices = () => {
	checkPudim();
	checkJellyfin();
}

// run every 10 minutes
setInterval(checkAllServices, 6000);
