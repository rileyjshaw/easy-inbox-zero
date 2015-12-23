function getFolders () {
	return JSON.parse(window.localStorage.getItem('folders')) || ['Inbox'];
}

chrome.runtime.onMessage.addListener(({method}, _, sendResponse) => {
	sendResponse(method === 'getFolders' ? {folders: getFolders()} : {});
});
