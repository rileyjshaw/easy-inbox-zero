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

	chrome.runtime.sendMessage({type: 'easy-inbox-zero:get-folders'}, (response) => {
		if (chrome.runtime.lastError || !response || response.error) {
			status.textContent = 'Could not load your folders. Please reopen this page to try again.';
			return;
		}
		foldersInput.value = Array.isArray(response.folders)
			? response.folders.join('\n') : DEFAULT_FOLDERS.join('\n');
		foldersInput.disabled = false;
		foldersInput.focus();
	});

	foldersInput.addEventListener('input', () => {
		chrome.storage.local.set({folders: normalizeFolders(foldersInput.value)}, () => {
			if (chrome.runtime.lastError) {
				clearTimeout(statusTimeout);
				status.textContent = 'Could not save your folders. Please try again.';
			} else showSavedStatus();
		});
	});
})();
