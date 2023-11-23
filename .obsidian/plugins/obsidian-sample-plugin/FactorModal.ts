import { App, Modal, Setting, } from 'obsidian';

// Modal to display factors from Obsidian files
export class FactorModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    const files = this.app.vault.getMarkdownFiles();

    // Get all files in directory
    const list: Record<string, string> = {};
    for (let i = 0; i < files.length; i++) {
      list[i] = files[i].path, "test";
    }

    contentEl.createEl("h1", { text: "Select Factor" });

    //  new Setting(contentEl)
    // 	.setName("")
    // 	.addText((text) =>
    // 		text.onChange((value) => {
    // 			this.result = value
    // 	}));

    // Dropdown Menu
    new Setting(contentEl)
      .addDropdown((drp) =>
        drp
          .addOption("Choose", "Choose File")
          .addOptions(list)
          .onChange((value) => {
            this.result = list[value];
          })
      );

    // Submit Button
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));

  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}