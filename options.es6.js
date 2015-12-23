chrome.runtime.sendMessage({method: 'getFolders'}, ({folders = []} = {}) => {
	const textarea = document.createElement('textarea');
	textarea.value = folders.join('\n');
	textarea.rows = 5;
	textarea.cols = 24;

	textarea.addEventListener('input', e => {
		window.localStorage.setItem('folders',
			JSON.stringify(e.target.value.split('\n').filter(x => x)));
	});

	document.body.appendChild(textarea);
	textarea.focus();
});
