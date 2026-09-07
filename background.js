(() => {
	'use strict';

	let storageReady;

	async function migrateFolders () {
		const stored = await chrome.storage.local.get(null);
		if (stored.storageVersion >= 1) return;

		let legacy;
		if (typeof localStorage !== 'undefined') {
			legacy = localStorage.getItem('folders');
		} else {
			const contexts = await chrome.runtime.getContexts({
				contextTypes: ['OFFSCREEN_DOCUMENT'],
				documentUrls: [chrome.runtime.getURL('migration.html')],
			});
			if (!contexts.length) {
				await chrome.offscreen.createDocument({
					url: 'migration.html',
					reasons: ['LOCAL_STORAGE'],
					justification: 'Import saved Gmail folder preferences from earlier extension versions.',
				});
			}
			try {
				const response = await chrome.runtime.sendMessage({type: 'easy-inbox-zero:read-legacy'});
				if (!response || response.error) throw new Error('Could not read existing folders.');
				legacy = response.folders;
			} finally {
				await chrome.offscreen.closeDocument();
			}
		}

		const migrated = {storageVersion: 1};
		if (stored.folders === undefined && legacy !== null) {
			try {
				const folders = JSON.parse(legacy);
				if (Array.isArray(folders)) {
					migrated.folders = [...new Set(folders.filter((value) => typeof value === 'string')
						.map((value) => value.trim()).filter(Boolean))];
				}
			} catch {
				// Invalid legacy JSON should not prevent the settings page from opening.
			}
		}
		await chrome.storage.local.set(migrated);
	}

	function ensureStorageReady () {
		if (!storageReady) {
			storageReady = migrateFolders().catch((error) => {
				storageReady = null;
				throw error;
			});
		}
		return storageReady;
	}

	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message?.type !== 'easy-inbox-zero:get-folders') return;
		ensureStorageReady().then(() => chrome.storage.local.get({folders: ['Inbox']}))
			.then(sendResponse, () => sendResponse({error: 'Could not load saved folders.'}));
		return true;
	});

	chrome.runtime.onInstalled.addListener(() => {
		ensureStorageReady().catch(console.error);
	});
})();
