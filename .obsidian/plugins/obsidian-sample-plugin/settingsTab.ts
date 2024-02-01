import MyPlugin from "./main";
import { App, PluginSettingTab, Setting, ToggleComponent, Notice } from "obsidian";

export class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // AI Setting
    containerEl.createEl("h2", { text: "Settings for my AI assistant." });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("OpenAI API Key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your key here")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) =>
            this.plugin.settings.apiKey = value;
    await this.plugin.saveSettings();
    this.plugin.build_api();
  })
      );

    containerEl.createEl("h3", { text: "Text Assistant" });

    new Setting(containerEl)
  .setName("Model Name")
  .setDesc("Select your model")
  .addDropdown((dropdown) =>
    dropdown
      .addOptions({
        "gpt-3.5-turbo": "gpt-3.5-turbo",
        "gpt-4-turbo-preview": "gpt-4-turbo",
        "gpt-4": "gpt-4",
      })
      .setValue(this.plugin.settings.modelName)
      .onChange(async (value) => {
        this.plugin.settings.modelName = value;
        await this.plugin.saveSettings();
        this.plugin.build_api();
      })
  );

new Setting(containerEl)
  .setName("Max Tokens")
  .setDesc("Select max number of generated tokens")
  .addText((text) =>
    text
      .setPlaceholder("Max tokens")
      .setValue(this.plugin.settings.maxTokens.toString())
      .onChange(async (value) => {
        const int_value = parseInt(value);
        if (!int_value || int_value <= 0) {
          new Notice("Error while parsing maxTokens ");
        } else {
          this.plugin.settings.maxTokens = int_value;
          await this.plugin.saveSettings();
          this.plugin.build_api();
        }
      })
  );

new Setting(containerEl)
  .setName("Prompt behavior")
  .setDesc("Replace selection")
  .addToggle((toogle) => {
    toogle
      .setValue(this.plugin.settings.replaceSelection)
      .onChange(async (value) => {
        this.plugin.settings.replaceSelection = value;
        await this.plugin.saveSettings();
        this.plugin.build_api();
      });
  });

containerEl.createEl("h3", { text: "Image Assistant" });

new Setting(containerEl)
  .setName("Default location for generated images")
  .setDesc("Where generated images are stored.")
  .addText((text) =>
    text
      .setPlaceholder("Enter the path to you image folder")
      .setValue(this.plugin.settings.imgFolder)
      .onChange(async (value) => {
        const path = value.replace(/\/+$/, "");
        if (path) {
          this.plugin.settings.imgFolder = path;
          await this.plugin.saveSettings();
        } else {
          new Notice("Image folder cannot be empty");
        }
      })
  );

new Setting(containerEl)
  .setName("Image Model Name")
  .setDesc("Select your model")
  .addDropdown((dropdown) =>
    dropdown
      .addOptions({
        "dall-e-3": "dall-e-3",
        "dall-e-2": "dall-e-2",
      })
      .setValue(this.plugin.settings.imageModelName)
      .onChange(async (value) => {
        this.plugin.settings.imageModelName = value;
        await this.plugin.saveSettings();
        this.plugin.build_api();
      })
  );

containerEl.createEl("h3", { text: "Speech to Text" });

new Setting(containerEl)
  .setName("The language of the input audio")
  .setDesc("Using ISO-639-1 format (en, fr, de, ...)")
  .addText((text) =>
    text
      .setValue(this.plugin.settings.language)
      .onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
      })
  );

// Matrix
new Setting(containerEl)
  .setName("Remember previous matrix type")
  .setDesc("After choosing a matrix type and clicking \"Create\", the type will be selected by default the next time you open the matrix creation window.")
  .addToggle((toggle: ToggleComponent) =>
    toggle
      .setValue(this.plugin.settings.rememberMatrixType)
      .onChange(async (value: boolean) => {
        this.plugin.settings.rememberMatrixType = value;
        await this.plugin.saveSettings();
      })
  );

new Setting(containerEl)
  .setName("Remember previous matrix dimensions")
  .setDesc("After entering a matrix and clicking \"Create\", the dimensions will be selected by default the next time you open the matrix creation window.")
  .addToggle((toggle: ToggleComponent) =>
    toggle
      .setValue(this.plugin.settings.rememberMatrixDimensions)
      .onChange(async (value: boolean) => {
        this.plugin.settings.rememberMatrixDimensions = value;
        await this.plugin.saveSettings();
      })
  );

new Setting(containerEl)
  .setName("Put matrix command on one line")
  .setDesc("Rather than inserting a newline after each row of the matrix, all text will be placed on one line. This will allow the matrix to immediately work between inline (single) $-signs, as well as multiline $$-signs.")
  .addToggle((toggle: ToggleComponent) =>
    toggle
      .setValue(this.plugin.settings.inline)
      .onChange(async (value: boolean) => {
        this.plugin.settings.inline = value;
        await this.plugin.saveSettings();
      })
  );
  }
}