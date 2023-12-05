import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as fs from 'fs';
import CreationModal from "./CreationModal";
import { MatrixSettingTab } from "./settings";
import { FactorModal } from 'FactorModal';

declare var count: number;

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

	async readMdFile2(f: string) {
		const vault = this.app.vault;
		//const fileName = f + '.md';
		const fileName = f;

		// Create a TFile object for the target .md file
		//const file: TFile | null = vault.getAbstractFileByPath('Data/' + fileName) as TFile;
		const file: TFile | null = vault.getAbstractFileByPath(fileName) as TFile; 

		// Read file from vault
		const fileContent = await vault.read(file);

		//Adds to New File from "fileContent"
		const factorFilePath: TFile | null = vault.getAbstractFileByPath("Data/Factors.md") as TFile; 
		//vault.append(factorFilePath, ("[[" + fileName + "]]" + "\n"));
		
		//vault.append(factorFilePath, ("[["));
		var test = false;
		var tagExists = false;
		var tagDone = false;
		for (let i = 0; i < fileContent.length; i++){
			//Check if the next char creates a tag "possibility"
			//if(fileContent[i+1] == "#"){
			//	vault.append(factorFilePath, "\n");
			//}
			
			if(fileContent[i] == "#"){
				//if (firstTag == true){
				//	vault.append(factorFilePath, "# ");
					//firstTag = false;
				//}
				//if (firstTag = true) {
				//	vault.append(factorFilePath, "\n");
				//}

				test = true;
				vault.append(factorFilePath, "\n");
				vault.append(factorFilePath, "# ");
				continue;
			}
			if((fileContent[i] == " " || fileContent[i] == "\n") && test == true){
				test = false
				tagDone = true;
			}			
			if(test == true){
				tagExists = true;
				vault.append(factorFilePath, fileContent[i]);
			}
			if (tagDone == true && tagExists == true){
				vault.append(factorFilePath, "\n");
				vault.append(factorFilePath, ("[[" + fileName + "]]" + "\n"));
				vault.append(factorFilePath, "\n");
				tagDone = false;
				tagExists = false;
			}
		}
		//if (tagExists == true)
		//	vault.append(factorFilePath, "\n");
	}

	// async selectFactor(){
	// 	new FactorModal(this.app, (result) => {
	// 		//create a new file to hold the factors
	// 		const vault = this.app.vault;
	// 		vault.create("../obsidian-plugin/Data/Factors.md", "");
			
	// 		// Loop to read every file in the "Data" folder
	// 		for (let i = 0; i < Object.keys(result).length; i++) {
	// 			this.readMdFile2(result[i]);
	// 			//vault.process(factorFilePath, (string) => fileName);
	// 		}
	// 	}).open();
	// }

	async selectFactor() {
		new FactorModal(this.app, (result, choice) => {
			if (choice == "File") {
				//create a new file to hold the factors
				const vault = this.app.vault;
				vault.create("../obsidian-plugin/Data/Factors.md", "");
				
				// Loop to read every file in the "Data" folder
				for (let i = 0; i < Object.keys(result).length; i++) {
					this.readMdFile2(result[i]);
					//vault.process(factorFilePath, (string) => fileName);
				}
			}
			else {
				//this.readMatrix(result);
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