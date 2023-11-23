import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as fs from 'fs';
import CreationModal from "./CreationModal";
import { MatrixSettingTab } from "./settings";
import { FactorModal } from 'FactorModal';

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

interface MatrixPluginSettings {
	rememberMatrixType: boolean; // Whether to save matrix type
	rememberMatrixDimensions: boolean; // Whether to save matrix dimensions
	inline: boolean; // Whether to put all generated text on one line
	lastUsedMatrix: string; // Previously-used type of matrix
	prevX: number | null; // Previously-used matrix X dimension
	prevY: number | null; // Previously-used matrix Y dimension
}

const DEFAULT_SETTINGS: Partial<MatrixPluginSettings> = {
	rememberMatrixType: true,
	rememberMatrixDimensions: true,
	inline: false,
	lastUsedMatrix: "",
	prevX: null,
	prevY: null,
};


export default class MyPlugin extends Plugin {
	// settings: MyPluginSettings;
	settings: MatrixPluginSettings;

	async onload() {
		// Read File or Matrix
		const read = this.addRibbonIcon('search', 'Search File', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.selectFactor();
		});

		// Perform additional things with the ribbon
		read.addClass('my-plugin-ribbon-class');

		// Create Matrix
		this.addRibbonIcon("pane-layout", "Obsidian Matrix Test", () => {
			new CreationModal(this.app, this).open();
		});

		this.addCommand({
			id: "obsidian-matrix-shortcut",
			name: "Open Obsidian Matrix menu",
			hotkeys: [],
			callback: () => {
				new CreationModal(this.app, this).open();
			},
		});

		this.addSettingTab(new MatrixSettingTab(this.app, this));

		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });

		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async readMdFile(f: string) {
		console.log("Reading file.")

		const vault = this.app.vault;
		//const fileName = f + '.md';
		const fileName = f;

		// Create a TFile object for the target .md file
		//const file: TFile | null = vault.getAbstractFileByPath('Data/' + fileName) as TFile;
		const file: TFile | null = vault.getAbstractFileByPath(fileName) as TFile;

		// If file exist
		if (file) {
			try {
				// Read file from vault
				const fileContent = await vault.read(file);

				new Notice(fileContent);
				console.log(fileContent);
			}
			catch (error) {
				console.error(error);
			}
		}
		else {
			console.error(`File not found: ${fileName}`);
			new Notice(`File not found: ${fileName}`);
		}
	}

	async readMatrix(f: string) {
		console.log("Reading matrix.");

		const vault = this.app.vault;
		const fileName = f;

		// Create a TFile object for the target .md file
		const file: TFile | null = vault.getAbstractFileByPath(fileName) as TFile;

		// If file exist
		if (file) {
			try {
				// Read file from vault
				const fileContent = await vault.read(file);

				// Number can only be from 1-5
				// Use a regular expression to remove non-numeric characters
				const numbersString = fileContent.replace(/[^0-9.]/g, '');

				// Convert the string of numbers to an array of actual numbers
				const numbersArray = numbersString.split('.').map(Number);
				const digitArray = Array.from(numbersArray.toString(), Number);

				new Notice(numbersString);

				console.log(digitArray);
			}
			catch (error) {
				console.error(error);
			}
		}
		else {
			console.error(`File not found: ${fileName}`);
			new Notice(`File not found: ${fileName}`);
		}
	}

	async multiModelMatrix() {

	}

	async selectFactor() {
		new FactorModal(this.app, (result) => {
			// this.readMatrix(result);
			this.readMdFile(result);
		}
		).open();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }
