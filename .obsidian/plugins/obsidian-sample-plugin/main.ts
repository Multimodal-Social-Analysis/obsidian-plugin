import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as fs from 'fs';
import CreationModal from "./CreationModal";
import { MatrixSettingTab } from "./settings";
import { FactorModal } from 'FactorModal';

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
		// Read selected file
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
	}

	async readMdFile(f: string) {
		console.log("Reading file.")

		const vault = this.app.vault;
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
		new FactorModal(this.app, (result, choice) => {
			if (choice == "File") {
				this.readMdFile(result);
			}
			else {
				this.readMatrix(result);
			}
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