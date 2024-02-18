import { App, Modal, Setting, Notice, TFile } from 'obsidian';

// Modal to display factors from Obsidian files
export class FactorModal extends Modal {
	result: Record<string, string>;
	choice: string = "File";
	onSubmit: (result: Record<string, string>, choice: string) => void;

	constructor(app: App, onSubmit: (result: Record<string, string>, choice: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		const files = this.app.vault.getMarkdownFiles();
		const choice: Record<string, string> = { "File": "File", "Matrix": "Matrix" };

		// Get all files in directory
		let list: Record<string, string> = {};
		for (let i = 0; i < files.length; i++) {
			list[i] = files[i].path, "test";
		}

		contentEl.createEl("h1", { text: "Data Analysis" });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Create Output File")
					.setCta()
					.onClick(() => {
						if (this.app.vault.getAbstractFileByPath("Output.md") == null) {
							//this.app.vault.createFolder("../obsidian-plugin/Output");
							this.app.vault.create("../obsidian-plugin/Output.md", "");
						}
						else {
							new Notice("Output.md already exists!");
						}
					}));

		new Setting(contentEl)
		.addButton((btn2) =>
			btn2
				.setButtonText("Analyze Data")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(list, this.choice);
				}));

		// Choose read matrix or md file
		// new Setting(contentEl)
		// 	.addDropdown((drp) =>
		// 		drp
		// 			.addOption("Choose", "Choose")
		// 			.addOptions(choice)
		// 			.onChange((value) => {
		// 				this.choice = choice[value];
		// 			})
		// 	);

		// Submit Button
		// new Setting(contentEl)
		// 	.addButton((btn) =>
		// 		btn
		// 			.setButtonText("Submit")
		// 			.setCta()
		// 			.onClick(() => {
		// 				this.close();
		// 				this.onSubmit(list, this.choice);
		// 			}));


		//this.result = list;
		//this.onSubmit(list);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}