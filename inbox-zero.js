(() => {
	'use strict';

	const DEFAULT_FOLDERS = ['Inbox'];
	const styleElement = document.createElement('style');
	styleElement.id = 'easy-inbox-zero';
	(document.head || document.documentElement).append(styleElement);

	let titlePattern = null;

	function normalizeFolders (value) {
		if (!Array.isArray(value)) return DEFAULT_FOLDERS;
		return [...new Set(value.map((folder) => String(folder).trim()).filter(Boolean))];
	}

	function escapeRegExp (value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function escapeCssString (value) {
		return value
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/\r?\n/g, '\\a ');
	}

	function updateTitle () {
		if (!titlePattern) return;
		const nextTitle = document.title.replace(titlePattern, '$1');
		if (nextTitle !== document.title) document.title = nextTitle;
	}

	function applyFolders (value) {
		const folders = normalizeFolders(value);
		if (folders.length) {
			const alternatives = folders.map(escapeRegExp).join('|');
			titlePattern = new RegExp(`("?(?:${alternatives})"?) \\(\\d+\\)`, 'g');
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

	chrome.storage.local.get({folders: DEFAULT_FOLDERS}, ({folders}) => {
		if (chrome.runtime.lastError) return;
		applyFolders(folders);
	});

	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local' && changes.folders) {
			applyFolders(changes.folders.newValue);
		}
	});
})();
