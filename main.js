const fs = require('fs');

// read telegram secret json from (from root) /secrets/telegram.json
const telegramSecrets = JSON.parse(fs.readFileSync('telegram.json', 'utf8'));

// anonymous function to send message
const sendMessage = (chatId, message) => {
	console.log(`Sending message to ${chatId}: ${message}`);
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
	});
}

const checkPudim = () => {
	console.log('Checking pudim...');

	// get request to https://pudim.xyz and check if second line starts with "Yes"
	fetch('https://pudim.xyz')
		.then(response => response.text())
		.then(body => {
			const lines = body.split('\n');
			if (!lines[1].startsWith('Yes')) {
				sendMessage(telegramSecrets.chatId, '[Backup relay] Pudim is Down!');
			}
		})
		.catch(error=> {
			sendMessage(telegramSecrets.chatId, '[Backup relay] Pudim is Down!');
		});

}

// run every 10 minutes
setInterval(checkPudim, 600000);
