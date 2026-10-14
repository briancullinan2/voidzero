import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';

export class SidebarWidget extends Widget
{
	private _fileSelected = new Signal<this, string>(this);
	private _repoInput: HTMLInputElement;
	private _fileListContainer: HTMLUListElement;

	constructor()
	{
		super();
		this.addClass('jp-SidebarWidget');
		this.node.innerHTML = `
      <h2>Code Doily Explorer</h2>
      <div class="control-group">
        <label for="repo-url">GitHub Repository URL</label>
        <input type="text" id="repo-url" value="https://github.com/torvalds/linux" />
      </div>
      <div class="control-group">
        <button id="load-repo-btn">Load & Generate Graph</button>
      </div>
      <div class="control-group" style="margin-top: 20px;">
        <label>Project Files & Notebooks</label>
        <ul class="file-list" id="sidebar-file-list">
          <li data-file="Core.js">Core.js</li>
          <li data-file="test-cells.js">test-cells.js</li>
          <li data-file="sigma-script.js">sigma-script.js</li>
          <li data-file="zuora-to-eloqua.ipynb">zuora-to-eloqua.ipynb</li>
        </ul>
      </div>
    `;

		this._repoInput = this.node.querySelector('#repo-url') as HTMLInputElement;
		this._fileListContainer = this.node.querySelector('#sidebar-file-list') as HTMLUListElement;

		const loadBtn = this.node.querySelector('#load-repo-btn');
		loadBtn?.addEventListener('click', () =>
		{
			this.loadGitHubRepo(this._repoInput.value);
		});

		this._fileListContainer.addEventListener('click', (e) =>
		{
			const target = e.target as HTMLElement;
			if(target.tagName === 'LI')
			{
				const fileName = target.getAttribute('data-file');
				if(fileName)
				{
					this._fileSelected.emit(fileName);
				}
			}
		});
	}

	public get fileSelected(): Signal<this, string>
	{
		return this._fileSelected;
	}

	public async loadGitHubRepo(url: string)
	{
		console.log(`Analyzing repository client-side for: ${url}`);
		// Drop your LG2 WASM / GitHub API client-side extraction logic here.
		// For demonstration, we simulate fetching repository commits and updating files.
		try
		{
			// Example public GitHub API metadata fetch
			const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
			if(match)
			{
				const repoPath = match[1];
				const res = await fetch(`https://api.github.com/repos/${repoPath}/contents`);
				const files = await res.json();
				if(Array.isArray(files))
				{
					this._fileListContainer.innerHTML = '';
					files.slice(0, 10).forEach(file =>
					{
						const li = document.createElement('li');
						li.textContent = file.name;
						li.setAttribute('data-file', file.path);
						this._fileListContainer.appendChild(li);
					});
				}
			}
		} catch(err)
		{
			console.warn('Network call restricted or rate-limited; using cached offline dataset.', err);
		}
	}
}
