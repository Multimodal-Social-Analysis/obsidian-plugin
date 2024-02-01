import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile
} from 'obsidian';
import * as fs from 'fs';
import { SettingTab } from "./settingsTab";
import MatrixModal from "./src/modals/MatrixModal";
import { FactorModal } from 'src/modals/FactorModal';
import { ChatModal, ImageModal, PromptModal, SpeechModal } from "./src/modals/ai_assistant_modal";
import { OpenAIAssistant } from "./src/AI/openai_api";

declare var count: number;

interface Settings {
	rememberMatrixType: boolean; // Whether to save matrix type
	rememberMatrixDimensions: boolean; // Whether to save matrix dimensions
	inline: boolean; // Whether to put all generated text on one line
	lastUsedMatrix: string; // Previously-used type of matrix
	prevX: number | null; // Previously-used matrix X dimension
	prevY: number | null; // Previously-used matrix Y dimension
	mySetting: string;
	apiKey: string;
	modelName: string;
	imageModelName: string;
	maxTokens: number;
	replaceSelection: boolean;
	imgFolder: string;
	language: string;
}

interface MatrixPluginSettings {
	rememberMatrixType: boolean; // Whether to save matrix type
	rememberMatrixDimensions: boolean; // Whether to save matrix dimensions
	inline: boolean; // Whether to put all generated text on one line
	lastUsedMatrix: string; // Previously-used type of matrix
	prevX: number | null; // Previously-used matrix X dimension
	prevY: number | null; // Previously-used matrix Y dimension
}

interface AiAssistantSettings {
	mySetting: string;
	apiKey: string;
	modelName: string;
	imageModelName: string;
	maxTokens: number;
	replaceSelection: boolean;
	imgFolder: string;
	language: string;
}

const DEFAULT_SETTINGS = {
	// Matrix
	rememberMatrixType: true,
	rememberMatrixDimensions: true,
	inline: false,
	lastUsedMatrix: "",
	prevX: null,
	prevY: null,

	// AI
	mySetting: "default",
	apiKey: "",
	modelName: "gpt-3.5-turbo",
	imageModelName: "dall-e-3",
	maxTokens: 500,
	replaceSelection: true,
	imgFolder: "AiAssistant/Assets",
	language: "",
};


export default class MyPlugin extends Plugin {
	settings: Settings;
	openai: OpenAIAssistant;

	build_api() {
		this.openai = new OpenAIAssistant(
			this.settings.apiKey,
			this.settings.modelName,
			this.settings.maxTokens
		);
	}

	async onload() {
		await this.loadSettings();

		this.build_api();

		/* AI Plugin */
		// AI Chat Mode
		this.addCommand({
			id: "chat-mode",
			name: "Open Assistant Chat",
			callback: () => {
				new ChatModal(this.app, this.openai).open();
			},
		});

		this.addRibbonIcon("enter", "Open AI Chat Mode", () => {
			new ChatModal(this.app, this.openai).open();
		});

		// AI Prompt Mode
		this.addCommand({
			id: "prompt-mode",
			name: "Open Assistant Prompt",
			editorCallback: async (editor: Editor) => {
				const selected_text = editor.getSelection().toString().trim();
				new PromptModal(
					this.app,
					async (x: { [key: string]: string }) => {
						let answer = await this.openai.api_call([
							{
								role: "user",
								content:
									x["prompt_text"] + " : " + selected_text,
							},
						]);
						answer = answer!;
						if (!this.settings.replaceSelection) {
							answer = selected_text + "\n" + answer.trim();
						}
						if (answer) {
							editor.replaceSelection(answer.trim());
						}
					},
					false,
					{}
				).open();
			},
		});

		// AI Image Generator
		this.addCommand({
			id: "img-generator",
			name: "Open Image Generator",
			editorCallback: async (editor: Editor) => {
				new PromptModal(
					this.app,
					async (prompt: { [key: string]: string }) => {
						const answer = await this.openai.img_api_call(
							this.settings.imageModelName,
							prompt["prompt_text"],
							prompt["img_size"],
							parseInt(prompt["num_img"]),
							prompt["is_hd"] === "true"
						);
						if (answer) {
							const imageModal = new ImageModal(
								this.app,
								answer,
								prompt["prompt_text"],
								this.settings.imgFolder
							);
							imageModal.open();
						}
					},
					true,
					{ model: this.settings.imageModelName }
				).open();
			},
		});

		// AI Speech to Text
		this.addCommand({
			id: "speech-to-text",
			name: "Open Speech to Text",
			editorCallback: (editor: Editor) => {
				new SpeechModal(
					this.app,
					this.openai,
					this.settings.language,
					editor
				).open();
			},
		});

		/* Factors Plugin */
		// Read file
		const read = this.addRibbonIcon('search', 'Search File', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.selectFactor();
		});

		// Perform additional things with the ribbon
		read.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: "obsidian-factors-shortcut",
			name: "Search File",
			hotkeys: [],
			callback: () => {
				this.selectFactor();
			},
		});

		/* Matrix Plugin */
		// Create Matrix
		this.addRibbonIcon("pane-layout", "Obsidian Matrix Test", () => {
			new MatrixModal(this.app, this).open();
		});

		this.addCommand({
			id: "obsidian-matrix-shortcut",
			name: "Open Obsidian Matrix menu",
			hotkeys: [],
			callback: () => {
				new MatrixModal(this.app, this).open();
			},
		});

		this.addSettingTab(new SettingTab(this.app, this));
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
		for (let i = 0; i < fileContent.length; i++) {
			//Check if the next char creates a tag "possibility"
			//if(fileContent[i+1] == "#"){
			//	vault.append(factorFilePath, "\n");
			//}

			if (fileContent[i] == "#") {
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
			if ((fileContent[i] == " " || fileContent[i] == "\n") && test == true) {
				test = false
				tagDone = true;
			}
			if (test == true) {
				tagExists = true;
				vault.append(factorFilePath, fileContent[i]);
			}
			if (tagDone == true && tagExists == true) {
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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


}