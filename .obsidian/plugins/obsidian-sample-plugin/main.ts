import {
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	FileView,
	Menu,
	WorkspaceLeaf,
	TAbstractFile,
	ObsidianProtocolData,
	MarkdownPostProcessorContext
} from 'obsidian';
import * as fs from 'fs';
import 'core-js/actual/structured-clone';
import { ViewPlugin } from '@codemirror/view';
import * as consts from 'src/Map/src/consts';
import * as leaflet from 'leaflet';
import { MainMapView } from 'src/Map/src/mainMapView';
import * as menus from "src/Map/src/menus"
import { mergeStates, stateFromParsedUrl, getCodeBlock, MapState } from 'src/Map/src/mapState';
import { UrlConvertor } from 'src/Map/src/urlConvertor';
import { LocationSuggest } from 'src/Map/src/locationSuggest';
import { SettingTab, Settings, DEFAULT_SETTINGS, convertLegacySettings, OpenBehavior } from "./settingsTab";
import { OpenAIAssistant } from "./src/AI/openai_api";
import MatrixModal from "./src/modals/MatrixModal";
import { FactorModal } from 'src/modals/FactorModal';
import { ChatModal, ImageModal, PromptModal, SpeechModal } from "./src/modals/ai_assistant_modal";
import { EmbeddedMap } from 'src/Map/src/embeddedMap';
import { IconCache } from 'src/Map/src/markerIcons';
import { askForLocation, RealTimeLocationSource } from 'src/Map/src/realTimeLocation';
import { getLinkReplaceEditorPlugin, GeoLinkReplacePlugin, replaceLinksPostProcessor } from 'src/Map/src/geoLinkReplacers';
import { getFrontMatterLocation, matchInlineLocation, verifyLocation } from 'src/Map/src/markers';
import { LocationSearchDialog } from 'src/Map/src/locationSearchDialog';
import { TagSuggest } from 'src/Map/src/tagSuggest';
import * as utils from 'src/Map/src/utils'
import { MapPreviewPopup } from 'src/Map/src/mapPreviewPopup';

// declare var count: number;

// interface MatrixPluginSettings {
// 	rememberMatrixType: boolean; // Whether to save matrix type
// 	rememberMatrixDimensions: boolean; // Whether to save matrix dimensions
// 	inline: boolean; // Whether to put all generated text on one line
// 	lastUsedMatrix: string; // Previously-used type of matrix
// 	prevX: number | null; // Previously-used matrix X dimension
// 	prevY: number | null; // Previously-used matrix Y dimension
// }

// interface AiAssistantSettings {
// 	mySetting: string;
// 	apiKey: string;
// 	modelName: string;
// 	imageModelName: string;
// 	maxTokens: number;
// 	replaceSelection: boolean;
// 	imgFolder: string;
// 	language: string;
// }

export default class MyPlugin extends Plugin {
	settings: Settings;
	openai: OpenAIAssistant;
	public highestVersionSeen: number = 0;
	public iconCache: IconCache;
	private suggestor: LocationSuggest;
	private tagSuggestor: TagSuggest;
	private urlConvertor: UrlConvertor;
	private mapPreviewPopup: MapPreviewPopup;
	public editorLinkReplacePlugin: ViewPlugin<GeoLinkReplacePlugin>;

	build_api() {
		this.openai = new OpenAIAssistant(
			this.settings.apiKey,
			this.settings.modelName,
			this.settings.maxTokens
		);
	}

	async onload() {
		await this.loadSettings();

		/* Map Plugin */
		// Add a new ribbon entry to the left bar
		// this.addRibbonIcon('map-pin', 'Open map view', (ev: MouseEvent) => {
		// 	this.openMap(
		// 		utils.mouseEventToOpenMode(this.settings, ev, 'openMap')
		// 	);
		// });

		// this.registerView(consts.MAP_VIEW_NAME, (leaf: WorkspaceLeaf) => {
		// 	return new MainMapView(leaf, this.settings, this);
		// });

		// this.editorLinkReplacePlugin = getLinkReplaceEditorPlugin(this);
		// this.registerEditorExtension(this.editorLinkReplacePlugin);

		// // Currently not in use; the feature is frozen until I have the time to work on its various quirks
		// // this.registerView(consts.MINI_MAP_VIEW_NAME, (leaf: WorkspaceLeaf) => {
		// // 	return new MiniMapView(leaf, this.settings, this);
		// // });

		// this.registerObsidianProtocolHandler(
		// 	'mapview',
		// 	async (params: ObsidianProtocolData) => {
		// 		if (params.action === 'mapview') {
		// 			if (params.mvaction === 'showonmap') {
		// 				const location =
		// 					params.centerLat && params.centerLng
		// 						? new leaflet.LatLng(
		// 							parseFloat(params.centerLat),
		// 							parseFloat(params.centerLng)
		// 						)
		// 						: null;
		// 				const accuracy = params.accuracy;
		// 				const source = params?.source ?? 'unknown';
		// 				const map = await this.openMap('replaceCurrent', null);
		// 				if (map) {
		// 					map.mapContainer.setRealTimeLocation(
		// 						location,
		// 						parseFloat(accuracy),
		// 						source as RealTimeLocationSource,
		// 						true
		// 					);
		// 				}
		// 			} else if (params.mvaction === 'newnotehere') {
		// 				const location =
		// 					params.centerLat && params.centerLng
		// 						? new leaflet.LatLng(
		// 							parseFloat(params.centerLat),
		// 							parseFloat(params.centerLng)
		// 						)
		// 						: null;
		// 				if (location) {
		// 					this.newFrontMatterNote(location, null, '');
		// 				}
		// 			} else if (params.mvaction === 'addtocurrentnotefm') {
		// 				const location =
		// 					params.centerLat && params.centerLng
		// 						? new leaflet.LatLng(
		// 							parseFloat(params.centerLat),
		// 							parseFloat(params.centerLng)
		// 						)
		// 						: null;
		// 				const editor = await utils.getEditor(this.app);
		// 				if (location && editor) {
		// 					const locationString = `[${location.lat},${location.lng}]`;
		// 					utils.verifyOrAddFrontMatter(
		// 						editor,
		// 						'location',
		// 						locationString
		// 					);
		// 				}
		// 			} else if (params.mvaction === 'addtocurrentnoteinline') {
		// 				const location =
		// 					params.centerLat && params.centerLng
		// 						? new leaflet.LatLng(
		// 							parseFloat(params.centerLat),
		// 							parseFloat(params.centerLng)
		// 						)
		// 						: null;
		// 				const editor = await utils.getEditor(this.app);
		// 				utils.insertLocationToEditor(
		// 					location,
		// 					editor,
		// 					this.settings
		// 				);
		// 			} else if (params.mvaction === 'copyinlinelocation') {
		// 				new Notice('Inline location copied to clipboard');
		// 			} else {
		// 				const state = stateFromParsedUrl(params);
		// 				// If a saved URL is opened in another device on which there aren't the same sources, use
		// 				// the default source instead
		// 				if (
		// 					state.chosenMapSource >=
		// 					this.settings.mapSources.length
		// 				)
		// 					state.chosenMapSource =
		// 						DEFAULT_SETTINGS.defaultState.chosenMapSource;
		// 				this.openMapWithState(state, 'replaceCurrent', false);
		// 			}
		// 		}
		// 	}
		// );

		// this.registerMarkdownCodeBlockProcessor(
		// 	'mapview',
		// 	async (
		// 		source: string,
		// 		el: HTMLElement,
		// 		ctx: MarkdownPostProcessorContext
		// 	) => {
		// 		let state = null;
		// 		try {
		// 			const rawStateObj = JSON.parse(source);
		// 			state = stateFromParsedUrl(rawStateObj);
		// 		} catch (e) {
		// 			el.setText(
		// 				'Map View is unable to parse this saved state: ' +
		// 				e.toString()
		// 			);
		// 		}
		// 		if (state) {
		// 			// Allow templates in the embedded query, e.g. to automatically insert the file name
		// 			state.query = utils.formatEmbeddedWithTemplates(
		// 				state.query,
		// 				ctx.sourcePath
		// 			);
		// 			let map = new EmbeddedMap(
		// 				el,
		// 				ctx,
		// 				this.app,
		// 				this.settings,
		// 				this
		// 			);
		// 			await map.open(state);
		// 		}
		// 	}
		// );

		// this.registerMarkdownPostProcessor(replaceLinksPostProcessor(this));

		// this.suggestor = new LocationSuggest(this.app, this.settings);
		// this.tagSuggestor = new TagSuggest(this.app, this.settings);
		// this.urlConvertor = new UrlConvertor(this.app, this.settings);

		// this.registerEditorSuggest(this.suggestor);
		// this.registerEditorSuggest(this.tagSuggestor);

		// await convertLegacySettings(this.settings, this);

		// this.iconCache = new IconCache(document.body);

		// this.mapPreviewPopup = null;

		// // Register commands to the command palette
		// // Command that opens the map view (same as clicking the map icon)
		// this.addCommand({
		// 	id: 'open-map-view',
		// 	name: 'Open Map View',
		// 	callback: () => {
		// 		this.app.workspace
		// 			.getLeaf()
		// 			.setViewState({ type: consts.MAP_VIEW_NAME });
		// 	},
		// });

		// // Command that looks up the selected text to find the location
		// this.addCommand({
		// 	id: 'convert-selection-to-location',
		// 	name: 'Convert Selection to Geolocation',
		// 	editorCheckCallback: (checking, editor, view) => {
		// 		if (checking) return editor.getSelection().length > 0;
		// 		this.suggestor.selectionToLink(editor);
		// 	},
		// });

		// // Command that adds a blank inline location at the cursor location
		// this.addCommand({
		// 	id: 'insert-geolink',
		// 	name: 'Add inline geolocation link',
		// 	editorCallback: (editor, view) => {
		// 		const positionBeforeInsert = editor.getCursor();
		// 		editor.replaceSelection('[](geo:)');
		// 		editor.setCursor({
		// 			line: positionBeforeInsert.line,
		// 			ch: positionBeforeInsert.ch + 1,
		// 		});
		// 	},
		// });

		// // Command that opens the location search dialog and creates a new note from this location
		// this.addCommand({
		// 	id: 'new-geolocation-note',
		// 	name: 'New geolocation note',
		// 	callback: () => {
		// 		const dialog = new LocationSearchDialog(
		// 			this.app,
		// 			this,
		// 			this.settings,
		// 			'newNote',
		// 			'New geolocation note'
		// 		);
		// 		dialog.open();
		// 	},
		// });

		// // Command that opens the location search dialog and adds the location to the current note
		// this.addCommand({
		// 	id: 'add-frontmatter-geolocation',
		// 	name: 'Add geolocation (front matter) to current note',
		// 	editorCallback: (editor, view) => {
		// 		const dialog = new LocationSearchDialog(
		// 			this.app,
		// 			this,
		// 			this.settings,
		// 			'addToNote',
		// 			'Add geolocation to note',
		// 			editor
		// 		);
		// 		dialog.open();
		// 	},
		// });

		// this.addCommand({
		// 	id: 'open-map-search',
		// 	name: 'Search active map view',
		// 	checkCallback: (checking) => {
		// 		const currentView = this.app.workspace.activeLeaf.view;
		// 		if (
		// 			currentView &&
		// 			currentView.getViewType() == consts.MAP_VIEW_NAME
		// 		) {
		// 			if (!checking)
		// 				(currentView as MainMapView).mapContainer.openSearch();
		// 			return true;
		// 		} else return false;
		// 	},
		// });

		// this.addCommand({
		// 	id: 'quick-map-embed',
		// 	name: 'Add an embedded map',
		// 	editorCallback: (editor: Editor, ctx) => {
		// 		this.openQuickEmbed(editor);
		// 	},
		// });

		// if (this.settings.supportRealTimeGeolocation) {
		// 	this.addCommand({
		// 		id: 'gps-focus-in-map-view',
		// 		name: 'GPS: find location and focus',
		// 		callback: () => {
		// 			askForLocation(this.settings, 'locate', 'showonmap');
		// 		},
		// 	});

		// 	this.addCommand({
		// 		id: 'gps-copy-inline-location',
		// 		name: 'GPS: copy inline location',
		// 		callback: () => {
		// 			askForLocation(
		// 				this.settings,
		// 				'locate',
		// 				'copyinlinelocation'
		// 			);
		// 		},
		// 	});

		// 	this.addCommand({
		// 		id: 'gps-new-note-here',
		// 		name: 'GPS: new geolocation note',
		// 		callback: () => {
		// 			askForLocation(this.settings, 'locate', 'newnotehere');
		// 		},
		// 	});

		// 	this.addCommand({
		// 		id: 'gps-add-to-current-note-front-matter',
		// 		name: 'GPS: add geolocation (front matter) to current note',
		// 		editorCallback: () => {
		// 			askForLocation(
		// 				this.settings,
		// 				'locate',
		// 				'addtocurrentnotefm'
		// 			);
		// 		},
		// 	});

		// 	this.addCommand({
		// 		id: 'gps-add-to-current-note-inline',
		// 		name: 'GPS: add geolocation (inline) at current position',
		// 		editorCallback: () => {
		// 			askForLocation(
		// 				this.settings,
		// 				'locate',
		// 				'addtocurrentnoteinline'
		// 			);
		// 		},
		// 	});
		// }

		// this.addSettingTab(new SettingTab(this.app, this));

		// // As part of geoLinkReplacers.ts, geolinks in notes are embedded with mouse events that
		// // override the default Obsidian behavior.
		// // We can only add these as strings, so to make this work, the functions that handle these mouse
		// // events need to be global.
		// // This one handles a geolink in a note.
		// (window as any).handleMapViewGeoLink = (
		// 	event: PointerEvent,
		// 	documentLocation: number,
		// 	markerId: string,
		// 	lat: string,
		// 	lng: string
		// ) => {
		// 	event.preventDefault();
		// 	const location = new leaflet.LatLng(
		// 		parseFloat(lat),
		// 		parseFloat(lng)
		// 	);
		// 	this.openMapWithLocation(
		// 		location,
		// 		utils.mouseEventToOpenMode(this.settings, event, 'openMap'),
		// 		null,
		// 		null,
		// 		false,
		// 		markerId
		// 	);
		// };

		// // As part of geoLinkReplacers.ts, geolinks in notes are embedded with mouse events that
		// // override the default Obsidian behavior.
		// // We can only add these as strings, so to make this work, the functions that handle these mouse
		// // events need to be global.
		// // This one opens a map preview popup on mouse enter.
		// (window as any).createMapPopup = (
		// 	event: PointerEvent,
		// 	documentLocation: number,
		// 	markerId: string,
		// 	lat: string,
		// 	lng: string
		// ) => {
		// 	if (!this.settings.showGeolinkPreview) return;
		// 	if (this.mapPreviewPopup) {
		// 		this.mapPreviewPopup.close(event);
		// 		this.mapPreviewPopup = null;
		// 	}
		// 	// See the class comment in MapPreviewPopup.
		// 	// This is inefficient: the map is loaded every time a user hovers a link, which can be time-consuming
		// 	// for huge vaults.
		// 	this.mapPreviewPopup = new MapPreviewPopup(
		// 		this.settings,
		// 		this,
		// 		this.app
		// 	);
		// 	this.mapPreviewPopup.open(
		// 		event,
		// 		documentLocation,
		// 		markerId,
		// 		lat,
		// 		lng
		// 	);
		// };

		// // As part of geoLinkReplacers.ts, geolinks in notes are embedded with mouse events that
		// // override the default Obsidian behavior.
		// // We can only add these as strings, so to make this work, the functions that handle these mouse
		// // events need to be global.
		// // This one closes the map preview popup on mouse leave.
		// (window as any).closeMapPopup = (event: PointerEvent) => {
		// 	this.mapPreviewPopup.close(event);
		// };

		// // Add items to the file context menu (run when the context menu is built)
		// // This is the context menu in the File Explorer and clicking "More options" (three dots) from within a file.
		// this.app.workspace.on('file-menu', (menu, file, source, leaf) =>
		// 	this.onFileMenu(menu, file, source, leaf)
		// );

		// this.app.workspace.on('active-leaf-change', (leaf) => {
		// 	if (utils.lastUsedLeaves.contains(leaf)) {
		// 		utils.lastUsedLeaves.remove(leaf);
		// 	}
		// 	utils.lastUsedLeaves.unshift(leaf);
		// });

		// // Currently frozen until I have time to work on this feature's quirks
		// // if (this.app.workspace.layoutReady) this.initMiniMap()
		// // else this.app.workspace.onLayoutReady(() => this.initMiniMap());

		// // Add items to the editor context menu (run when the context menu is built)
		// // This is the context menu when right clicking within an editor view.
		// this.app.workspace.on('editor-menu', (menu, editor, view) => {
		// 	this.onEditorMenu(menu, editor, view as MarkdownView);
		// });

		// // Watch for pasted text and add a 'locations:' front matter where applicable if the user pastes
		// // an inline geolocation
		// this.app.workspace.on(
		// 	'editor-paste',
		// 	(evt: ClipboardEvent, editor: Editor) => {
		// 		if (this.settings.fixFrontMatterOnPaste) {
		// 			const text = evt.clipboardData.getData('text');
		// 			if (text) {
		// 				const inlineMatch = matchInlineLocation(text);
		// 				if (inlineMatch && inlineMatch.length > 0) {
		// 					// The pasted text contains an inline location, so try to help the user by verifying
		// 					// a frontmatter exists
		// 					if (
		// 						utils.verifyOrAddFrontMatterForInline(
		// 							editor,
		// 							this.settings
		// 						)
		// 					) {
		// 						new Notice(
		// 							"The note's front matter was updated to denote locations are present"
		// 						);
		// 					}
		// 				}
		// 			}
		// 		}
		// 	}
		// );

		/* AI Plugin */
		this.build_api();

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

	public findOpenMainView(): WorkspaceLeaf {
		const maps = this.app.workspace.getLeavesOfType(consts.MAP_VIEW_NAME);
		if (maps && maps.length > 0) return maps[0];
		else return null;
	}

	public async openMap(
		openBehavior: OpenBehavior,
		state?: MapState
	): Promise<MainMapView> {
		// Find the best candidate for a leaf to open the map view on according to the required
		// behavior.
		let chosenLeaf: WorkspaceLeaf = null;
		// Prepare a few options for a candidate leaf
		const openMapView = this.findOpenMainView();
		const existingLeafToReplace = this.app.workspace.getLeaf(false);
		const emptyLeaf = this.app.workspace.getLeavesOfType('empty');
		let createPane = false;
		let createTab = false;
		switch (openBehavior) {
			case 'replaceCurrent':
				chosenLeaf = existingLeafToReplace;
				if (!chosenLeaf && emptyLeaf) chosenLeaf = emptyLeaf[0];
				break;
			case 'dedicatedPane':
				chosenLeaf = openMapView;
				if (!chosenLeaf) createPane = true;
				break;
			case 'dedicatedTab':
				chosenLeaf = openMapView;
				if (!chosenLeaf) createTab = true;
				break;
			case 'alwaysNewPane':
				createPane = true;
				break;
			case 'alwaysNewTab':
				createTab = true;
				break;
			case 'lastUsed':
				throw Error('This option is not supported here');
		}
		if (createTab) chosenLeaf = this.app.workspace.getLeaf('tab');
		if (createPane)
			chosenLeaf = this.app.workspace.getLeaf(
				'split',
				this.settings.newPaneSplitDirection
			);
		if (!chosenLeaf) {
			chosenLeaf = this.app.workspace.getLeaf(true);
		}
		this.app.workspace.setActiveLeaf(chosenLeaf);
		await chosenLeaf.setViewState({
			type: consts.MAP_VIEW_NAME,
			state: state ?? this.settings.defaultState,
		});
		if (chosenLeaf.view instanceof MainMapView) return chosenLeaf.view;
		return null;
	}

	public async openMapWithState(
		state: MapState,
		openBehavior: OpenBehavior,
		forceAutoFit?: boolean,
		highlightFile: TAbstractFile = null,
		highlightFileLine: number = null,
		highlightMarkerId: string = null
	) {
		const mapView = await this.openMap(openBehavior, state);
		if (mapView && mapView.mapContainer) {
			const map = mapView.mapContainer;
			if (forceAutoFit || state.autoFit) map.autoFitMapToMarkers();
			if (highlightFile) {
				const markerToHighlight = map.findMarkerByFileLine(
					highlightFile,
					highlightFileLine
				);
				map.setHighlight(markerToHighlight);
			} else if (highlightMarkerId) {
				const markerToHighlight = map.findMarkerById(highlightMarkerId);
				map.setHighlight(markerToHighlight);
			}
		}
	}

	/**
			 * Open an instance of the map at the given geolocation.
			 * The active query is cleared so we'll be sure that the location is actually displayed.
			 * @param location The geolocation to open the map at
			 * @param openBehavior the behavior to use
			 * @param file the file this location belongs to (for highlighting)
			 * @param fileLine the line in the file (if it's an inline link)
			 * @param keepZoom don't zoom the map
			 */
	async openMapWithLocation(
		location: leaflet.LatLng,
		openBehavior: OpenBehavior,
		file: TAbstractFile | null = null,
		fileLine: number = null,
		keepZoom: boolean = false,
		markerIdToHighlight: string = null
	) {
		let newState = {
			mapCenter: location,
			query: '',
		} as MapState;
		if (!keepZoom)
			newState = mergeStates(newState, {
				mapZoom: this.settings.zoomOnGoFromNote,
			});
		await this.openMapWithState(
			newState,
			openBehavior,
			false,
			file,
			fileLine,
			markerIdToHighlight
		);
	}

	/**
			 * Get the geolocation on the current editor line
			 * @param editor obsidian Editor instance
			 * @param view obsidian FileView instance
			 * @private
			 */
	private getLocationOnEditorLine(
		editor: Editor,
		lineNumber: number,
		view: FileView,
		alsoFrontMatter: boolean
	): leaflet.LatLng {
		const line = editor.getLine(lineNumber);
		const match = matchInlineLocation(line)[0];
		let selectedLocation = null;
		if (match)
			selectedLocation = new leaflet.LatLng(
				parseFloat(match.groups.lat),
				parseFloat(match.groups.lng)
			);
		else if (alsoFrontMatter) {
			const fmLocation = getFrontMatterLocation(view.file, this.app);
			if (line.indexOf('location') > -1 && fmLocation)
				selectedLocation = fmLocation;
		}
		if (selectedLocation) {
			verifyLocation(selectedLocation);
			return selectedLocation;
		}
		return null;
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

	initMiniMap() {
		if (
			this.app.workspace.getLeavesOfType(consts.MINI_MAP_VIEW_NAME).length
		)
			return;
		this.app.workspace
			.getRightLeaf(false)
			.setViewState({ type: consts.MINI_MAP_VIEW_NAME });
	}

	onFileMenu(
		menu: Menu,
		file: TAbstractFile,
		_source: string,
		leaf?: WorkspaceLeaf
	) {
		const editor =
			leaf && leaf.view instanceof MarkdownView ? leaf.view.editor : null;
		if (file instanceof TFile) {
			const location = getFrontMatterLocation(file, this.app);
			if (location) {
				// If there is a geolocation in the front matter of the file
				// Add an option to open it in the map
				menus.addShowOnMap(
					menu,
					location,
					file,
					null,
					this,
					this.settings
				);
				// Add an option to open it in the default app
				menus.addOpenWith(menu, location, this.settings);
			} else {
				if (editor) {
					// If there is no valid geolocation in the front matter, add a menu item to populate it.
					menus.addGeolocationToNote(
						menu,
						this.app,
						this,
						editor,
						this.settings
					);
				}
			}
			if (utils.isMobile(this.app)) {
				// On mobile there's no editor context menu, so add it here instead
				this.onEditorMenu(menu, editor, leaf.view as MarkdownView);
			}
			menus.addFocusNoteInMapView(menu, file, this.settings, this);
			if (this.settings.debug)
				menus.addImport(menu, editor, this.app, this, this.settings);
		}
	}

	onEditorMenu(menu: Menu, editor: Editor, view: MarkdownView) {
		if (!editor) return;
		if (view instanceof FileView) {
			let multiLineMode = false;
			const [fromLine, toLine, geolocations] =
				this.geolocationsWithinSelection(editor, view);
			if (geolocations.length > 0) {
				multiLineMode = true;
				menus.addFocusLinesInMapView(
					menu,
					view.file,
					fromLine,
					toLine,
					geolocations.length,
					this,
					this.settings
				);
			}
			if (!multiLineMode) {
				const editorLine = editor.getCursor().line;
				const location = this.getLocationOnEditorLine(
					editor,
					editorLine,
					view,
					true
				);
				if (location) {
					const editorLine = editor.getCursor().line;
					menus.addShowOnMap(
						menu,
						location,
						view.file,
						editorLine,
						this,
						this.settings
					);
					menus.addOpenWith(menu, location, this.settings);
				}
			}
			menus.addUrlConversionItems(
				menu,
				editor,
				this.suggestor,
				this.urlConvertor,
				this.settings
			);
			menus.addEmbed(menu, this, editor);
		}
	}

	geolocationsWithinSelection(
		editor: Editor,
		view: MarkdownView
	): [number, number, leaflet.LatLng[]] {
		let geolocations: leaflet.LatLng[] = [];
		const editorSelections = editor.listSelections();
		if (editorSelections && editorSelections.length > 0) {
			const anchorLine = editorSelections[0].anchor.line;
			const headLine = editorSelections[0].head.line;
			if (anchorLine != headLine) {
				const fromLine = Math.min(anchorLine, headLine);
				const toLine = Math.max(anchorLine, headLine);
				let geolocations: leaflet.LatLng[] = [];
				for (let line = fromLine; line <= toLine; line++) {
					const geolocationOnLine = this.getLocationOnEditorLine(
						editor,
						line,
						view,
						false
					);
					if (geolocationOnLine) geolocations.push(geolocationOnLine);
				}
				return [fromLine, toLine, geolocations];
			}
		}
		return [null, null, []];
	}

	openQuickEmbed(editor: Editor) {
		const searchDialog = new LocationSearchDialog(
			this.app,
			this,
			this.settings,
			'custom',
			'Quick Map Embed',
			editor
		);
		searchDialog.customOnSelect = (selection, evt) => {
			const state = mergeStates(this.settings.defaultState, {
				mapCenter: selection.location,
			} as MapState);
			if (state.mapZoom < consts.MIN_QUICK_EMBED_ZOOM)
				state.mapZoom = consts.MIN_QUICK_EMBED_ZOOM;
			const codeBlock = getCodeBlock(state);
			const cursor = editor.getCursor();
			editor.transaction({
				changes: [{ from: cursor, text: codeBlock }],
			});
			editor.setCursor({
				line: cursor.line + codeBlock.split('\n').length,
				ch: 0,
			});
		};
		searchDialog.setPlaceholder(
			'Quick map embed: search for an address, landmark or business name to center the map on.'
		);
		searchDialog.open();
	}

	async newFrontMatterNote(
		location: leaflet.LatLng,
		ev: MouseEvent | KeyboardEvent | null,
		query: string
	) {
		const locationString = `${location.lat},${location.lng}`;
		const newFileName = utils.formatWithTemplates(
			this.settings.newNoteNameFormat,
			query
		);
		const [file, cursorPos] = await utils.newNote(
			this.app,
			'singleLocation',
			this.settings.newNotePath,
			newFileName,
			locationString,
			this.settings.newNoteTemplate
		);
		// If there is an open map view, use it to decide how and where to open the file.
		// Otherwise, open the file from the active leaf
		const mapView = utils.findOpenMapView(this.app);
		if (mapView) {
			mapView.mapContainer.goToFile(
				file,
				ev?.ctrlKey ? 'dedicatedPane' : 'replaceCurrent',
				async (editor) =>
					utils.goToEditorLocation(editor, cursorPos, false)
			);
		} else {
			const leaf = this.app.workspace.activeLeaf;
			await leaf.openFile(file);
			const editor = await utils.getEditor(this.app);
			if (editor)
				await utils.goToEditorLocation(editor, cursorPos, false);
		}
	}

	onunload() {

	}
}