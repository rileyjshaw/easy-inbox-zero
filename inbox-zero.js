(() => {
	'use strict';

	const DEFAULT_FOLDERS = ['Inbox'];
	const styleElement = document.createElement('style');
	styleElement.id = 'easy-inbox-zero';
	(document.head || document.documentElement).append(styleElement);

	let titlePattern = null;
	let originalTitle = document.title;
	let appliedTitle = null;

	function normalizeFolders (value) {
		if (!Array.isArray(value)) return DEFAULT_FOLDERS;
		return [...new Set(value.filter((folder) => typeof folder === 'string')
			.map((folder) => folder.trim()).filter(Boolean))];
	}

	function escapeRegExp (value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function escapeCssString (value) {
		return value
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/[\n\r\f\0]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `);
	}

	function updateTitle () {
		if (document.title !== appliedTitle) originalTitle = document.title;
		const nextTitle = titlePattern ? originalTitle.replace(titlePattern, '$1') : originalTitle;
		appliedTitle = nextTitle;
		if (nextTitle !== document.title) document.title = nextTitle;
	}

	function applyFolders (value) {
		const folders = normalizeFolders(value);
		if (folders.length) {
			const alternatives = folders.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
			titlePattern = new RegExp(`^("?(?:${alternatives})"?) \\(\\d+\\)`);
		} else {
			titlePattern = null;
		}

		styleElement.textContent = folders.map((folder) => {
			const selectorValue = escapeCssString(`${folder} (`);
			const label = escapeCssString(folder);
			return `
				[title^="${selectorValue}"] {
					visibility: hidden !important;
				}
				[title^="${selectorValue}"]::before {
					content: "${label}";
					font-weight: normal;
					visibility: visible !important;
				}
			`;
		}).join('\n');

		updateTitle();
	}

	const titleObserver = new MutationObserver(updateTitle);
	titleObserver.observe(document.head || document.documentElement, {
		childList: true,
		characterData: true,
		subtree: true,
	});

	chrome.runtime.sendMessage({type: 'easy-inbox-zero:get-folders'}, (response) => {
		if (chrome.runtime.lastError || !response || response.error) return;
		applyFolders(response.folders);
	});

	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local' && changes.folders) {
			applyFolders(changes.folders.newValue);
		}
	});
})();
