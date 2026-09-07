chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type !== 'easy-inbox-zero:read-legacy') return;
	try {
		sendResponse({folders: localStorage.getItem('folders')});
	} catch {
		sendResponse({error: 'Could not read existing folders.'});
	}
});
