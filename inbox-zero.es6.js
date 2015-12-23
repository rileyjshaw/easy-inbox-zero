chrome.runtime.sendMessage({method: 'getFolders'}, ({folders = []} = {}) => {
	const folderRE = new RegExp(`(\\"?[${folders.join('|')}]\\"?) \\(\\d+\\)`);

	// Hide unread counts from the window title.
	const XMutationObserver = window.MutationObserver ||
		window.WebKitMutationObserver || window.MozMutationObserver;
	const observer = new XMutationObserver(({0: {addedNodes: {0: newTitle}}}) => {
		if (newTitle)
			newTitle.textContent = newTitle.textContent.replace(folderRE, '$1');
	});

	observer.observe(document.querySelector('title'), {
		subtree: true,
		characterData: true,
		childList: true,
	});

	// Hide unread counts from the side pane. Clever solution by @elmquist.
	const cssContent = folders.reduce((acc, cur) => `${acc}
	[title^='${cur} ('] {
		visibility: hidden;
	}
	[title^='${cur} (']:before {
		content: '${cur}';
		font-weight: normal;
		visibility: visible;
	}`, '');

	const styleEl = document.createElement('style');
	styleEl.id = 'easy-inbox-zero';
	styleEl.appendChild(document.createTextNode(cssContent));
	document.body.appendChild(styleEl);
});
