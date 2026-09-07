(() => {
	'use strict';

	const DEFAULT_FOLDERS = ['Inbox'];
	const foldersInput = document.getElementById('folders');
	const status = document.getElementById('status');
	let statusTimeout;

	function normalizeFolders (value) {
		return [...new Set(value
			.split('\n')
			.map((folder) => folder.trim())
			.filter(Boolean))];
	}

	function showSavedStatus () {
		status.textContent = 'Saved';
		clearTimeout(statusTimeout);
		statusTimeout = setTimeout(() => {
			status.textContent = '';
		}, 1200);
	}

	chrome.storage.local.get({folders: DEFAULT_FOLDERS}, ({folders}) => {
		if (chrome.runtime.lastError) return;
		foldersInput.value = Array.isArray(folders) ? folders.join('\n') : 'Inbox';
		foldersInput.focus();
	});

	foldersInput.addEventListener('input', () => {
		chrome.storage.local.set({folders: normalizeFolders(foldersInput.value)}, () => {
			if (!chrome.runtime.lastError) showSavedStatus();
		});
	});
})();
