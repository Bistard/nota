import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { IS_MAC } from "src/base/common/platform";
import { MenuTypes, IMenuItemRegistration } from "src/platform/menu/common/menu";
import { AllCommands } from "src/workbench/services/workbench/commandList";

// Application Menu (For macOS)
export const menuTitleApplicationRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleApplicationRegister',
    (registrant) => {
        const menuItems: IMenuItemRegistration[] = [
            {
                group: '1_about',
                title: 'About Nota',
                command: {
                    // commandID: CommandID.About,
                    commandID: "",
                },
            },
            {
                group: '2_updates',
                title: 'Check for Updates...',
                command: {
                    // commandID: CommandID.CheckForUpdates,
                    commandID: "",
                },
            },
            {
                group: '3_settings',
                title: 'Settings...',
                command: {
                    // commandID: CommandID.OpenSettings,
                    commandID: "",
                },
            },
            {
                group: '5_window',
                title: `Hide Nota`,
                command: {
                    // commandID: CommandID.HideApp,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+H' : undefined,
                },
            },
            {
                group: '5_window',
                title: 'Hide Others',
                command: {
                    // commandID: CommandID.HideOthers,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Alt+H' : undefined,
                },
            },
            {
                group: '5_window',
                title: 'Show All',
                command: {
                    // commandID: CommandID.ShowAll,
                    commandID: "",
                },
            },
            {
                group: '6_quit',
                title: IS_MAC ? 'Quit Nota' : 'Exit Nota',
                command: {
                    // commandID: CommandID.ExitApp,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Q' : undefined,
                },
            },
        ];

        for (const item of menuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarApplication, item);
        }
    }
);

// File Menu
export const menuTitleFileRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleFileRegister',
    (registrant) => {
        const fileMenuItems: IMenuItemRegistration[] = [
            // New Operations
            {
                group: '1_new',
                title: 'New File',
                command: {
                    // commandID: CommandID.NewFile,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+N' : 'Ctrl+N',
                },
            },
            {
                group: '1_new',
                title: 'New Tab',
                command: {
                    // commandID: CommandID.NewTab,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+T' : 'Ctrl+T',
                },
            },
            {
                group: '1_new',
                title: 'New Window',
                command: {
                    // commandID: CommandID.NewWindow,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Shift+N' : 'Ctrl+Shift+N',
                },
            },
            // Separator
            // Open Operations
            {
                group: '2_open',
                title: 'Open File…',
                command: {
                    // commandID: CommandID.OpenFile,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+O' : 'Ctrl+O',
                },
            },
            {
                group: '2_open',
                title: 'Open Folder…',
                command: {
                    // commandID: CommandID.OpenFolder,
                    commandID: "",
                },
            },
            {
                group: '2_open',
                title: 'Open Recent',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.FileOpenRecent,
            },
            // Separator
            // Save Operations
            {
                group: '3_save',
                title: 'Save',
                command: {
                    // commandID: CommandID.Save,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+S' : 'Ctrl+S',
                },
            },
            {
                group: '3_save',
                title: 'Save As…',
                command: {
                    // commandID: CommandID.SaveAs,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+S' : 'Ctrl+Shift+S',
                },
            },
            {
                group: '3_save',
                title: 'Save All',
                command: {
                    // commandID: CommandID.SaveAll,
                    commandID: "",
                },
            },
            {
                group: '3_save',
                title: 'Reveal In Explorer/Finder',
                command: {
                    // commandID: CommandID.RevealInExplorer,
                    commandID: "",
                },
            },
            // Separator
            // Export Operations
            {
                group: '4_export',
                title: 'Export As',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.FileExportAs,
            },
            {
                group: '4_export',
                title: 'Print…',
                command: {
                    // commandID: CommandID.Print,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+P' : 'Ctrl+P',
                },
            },
            // Separator
            // Auto Save
            {
                group: '5_auto_save',
                title: 'Auto Save',
                command: {
                    // commandID: CommandID.ToggleAutoSave,
                    commandID: "",
                },
            },
            // Separator
            // Close Operations
            {
                group: '6_close',
                title: 'Close Current File',
                command: {
                    // commandID: CommandID.CloseFile,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+W' : 'Ctrl+W',
                },
            },
            {
                group: '6_close',
                title: 'Close Current Folder',
                command: {
                    commandID: AllCommands.fileTreeCloseCurrentFolder,
                },
            },
            {
                group: '6_close',
                title: 'Close Current Window',
                command: {
                    // commandID: CommandID.CloseWindow,
                    commandID: "",
                },
            },
        ];

        for (const item of fileMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarFile, item);
        }

        // Register 'Open Recent' submenu items
        const openRecentMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_recent',
                title: 'Reopen Recent Closed',
                command: {
                    // commandID: CommandID.ReopenClosedFile,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+T' : 'Ctrl+Shift+T',
                },
            },
            {
                group: '2_dynamic',
                title: 'DYNAMIC',
                command: {
                    commandID: "",
                },
            },
            {
                group: '3_clear',
                title: 'Clear Recent Opened',
                command: {
                    // commandID: CommandID.ClearRecentOpened,
                    commandID: "",
                },
            },
        ];

        for (const item of openRecentMenuItems) {
            registrant.registerMenuItem(MenuTypes.FileOpenRecent, item);
        }

        // Register 'Export As' submenu items
        const exportAsMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_export_options',
                title: 'Export as PDF',
                command: {
                    // commandID: CommandID.ExportAsPDF,
                    commandID: "",
                },
            },
            {
                group: '1_export_options',
                title: 'Export as HTML',
                command: {
                    // commandID: CommandID.ExportAsHTML,
                    commandID: "",
                },
            },
            // Add other export options as needed
        ];

        for (const item of exportAsMenuItems) {
            registrant.registerMenuItem(MenuTypes.FileExportAs, item);
        }
    }
);

// Edit Menu
export const menuTitleEditRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleEditRegister',
    (registrant) => {
        const editMenuItems: IMenuItemRegistration[] = [
            // Undo/Redo
            {
                group: '1_undo_redo',
                title: 'Undo',
                command: {
                    // commandID: CommandID.Undo,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Z' : 'Ctrl+Z',
                },
            },
            {
                group: '1_undo_redo',
                title: 'Redo',
                command: {
                    // commandID: CommandID.Redo,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+Z' : 'Ctrl+Y',
                },
            },
            // Separator
            // Clipboard
            {
                group: '2_clipboard',
                title: 'Cut',
                command: {
                    // commandID: CommandID.Cut,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+X' : 'Ctrl+X',
                },
            },
            {
                group: '2_clipboard',
                title: 'Copy',
                command: {
                    // commandID: CommandID.Copy,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+C' : 'Ctrl+C',
                },
            },
            {
                group: '2_clipboard',
                title: 'Paste',
                command: {
                    // commandID: CommandID.Paste,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+V' : 'Ctrl+V',
                },
            },
            // Separator
            // Find/Replace
            {
                group: '3_find',
                title: 'Find',
                command: {
                    // commandID: CommandID.Find,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+F' : 'Ctrl+F',
                },
            },
            {
                group: '3_find',
                title: 'Replace',
                command: {
                    // commandID: CommandID.Replace,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Alt+F' : 'Ctrl+H',
                },
            },
            // Separator
            {
                group: '4_find_in_files',
                title: 'Find In Files',
                command: {
                    // commandID: CommandID.FindInFiles,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+F' : 'Ctrl+Shift+F',
                },
            },
            {
                group: '4_find_in_files',
                title: 'Replace In Files',
                command: {
                    // commandID: CommandID.ReplaceInFiles,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+H' : 'Ctrl+Shift+H',
                },
            },
        ];

        for (const item of editMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarEdit, item);
        }
    }
);

// Selection Menu
export const menuTitleSelectionRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleSelectionRegister',
    (registrant) => {
        const selectionMenuItems: IMenuItemRegistration[] = [
            // Select Operations
            {
                group: '1_select',
                title: 'Select All',
                command: {
                    // commandID: CommandID.SelectAll,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+A' : 'Ctrl+A',
                },
            },
            {
                group: '1_select',
                title: 'Select Block',
                command: {
                    // commandID: CommandID.SelectBlock,
                    commandID: "",
                },
            },
            {
                group: '1_select',
                title: 'Select Line',
                command: {
                    // commandID: CommandID.SelectLine,
                    commandID: "",
                },
            },
            {
                group: '1_select',
                title: 'Select Word',
                command: {
                    // commandID: CommandID.SelectWord,
                    commandID: "",
                },
            },
            // Separator
            // Move Operations
            {
                group: '2_move',
                title: 'Move Line Up',
                command: {
                    // commandID: CommandID.MoveLineUp,
                    commandID: "",
                    keybinding: IS_MAC ? 'Option+Up' : 'Alt+Up',
                },
            },
            {
                group: '2_move',
                title: 'Move Line Down',
                command: {
                    // commandID: CommandID.MoveLineDown,
                    commandID: "",
                    keybinding: IS_MAC ? 'Option+Down' : 'Alt+Down',
                },
            },
            {
                group: '2_move',
                title: 'Move Block Up',
                command: {
                    // commandID: CommandID.MoveBlockUp,
                    commandID: "",
                },
            },
            {
                group: '2_move',
                title: 'Move Block Down',
                command: {
                    // commandID: CommandID.MoveBlockDown,
                    commandID: "",
                },
            },
            // Separator
            // Jump Operations
            {
                group: '3_jump',
                title: 'Jump To Top',
                command: {
                    // commandID: CommandID.JumpToTop,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Up' : 'Ctrl+Home',
                },
            },
            {
                group: '3_jump',
                title: 'Jump To Bottom',
                command: {
                    // commandID: CommandID.JumpToBottom,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Down' : 'Ctrl+End',
                },
            },
            {
                group: '3_jump',
                title: 'Jump To Selection',
                command: {
                    // commandID: CommandID.JumpToSelection,
                    commandID: "",
                },
            },
            {
                group: '3_jump',
                title: 'Jump to Line Start',
                command: {
                    // commandID: CommandID.JumpToLineStart,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Left' : 'Home',
                },
            },
            {
                group: '3_jump',
                title: 'Jump to Line End',
                command: {
                    // commandID: CommandID.JumpToLineEnd,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Right' : 'End',
                },
            },
        ];

        for (const item of selectionMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarSelection, item);
        }
    }
);

// Insert Menu
export const menuTitleInsertRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleInsertRegister',
    (registrant) => {
        const insertMenuItems: IMenuItemRegistration[] = [
            // Insert Elements
            {
                group: '1_elements',
                title: 'Paragraph',
                command: {
                    // commandID: CommandID.InsertParagraph,
                    commandID: "",
                },
            },
            {
                group: '1_elements',
                title: 'Heading',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertHeading,
            },
            {
                group: '1_elements',
                title: 'BlockQuote',
                command: {
                    // commandID: CommandID.InsertBlockQuote,
                    commandID: "",
                },
            },
            {
                group: '1_elements',
                title: 'CodeBlock',
                command: {
                    // commandID: CommandID.InsertCodeBlock,
                    commandID: "",
                },
            },
            {
                group: '1_elements',
                title: 'List',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertList,
            },
            {
                group: '1_elements',
                title: 'Table',
                command: {
                    // commandID: CommandID.InsertTable,
                    commandID: "",
                },
            },
            {
                group: '1_elements',
                title: 'Math Block',
                command: {
                    // commandID: CommandID.InsertMathBlock,
                    commandID: "",
                },
            },
            {
                group: '1_elements',
                title: 'Image',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertImage,
            },
            {
                group: '1_elements',
                title: 'Footnote',
                command: {
                    // commandID: CommandID.InsertFootnote,
                    commandID: "",
                },
            },
            // Separator
            // Line Operations
            {
                group: '2_lines',
                title: 'Horizontal Line',
                command: {
                    // commandID: CommandID.InsertHorizontalLine,
                    commandID: "",
                },
            },
            {
                group: '2_lines',
                title: 'Line Break',
                command: {
                    // commandID: CommandID.InsertLineBreak,
                    commandID: "",
                },
            },
            // Separator
            // Paragraph Operations
            {
                group: '3_paragraph',
                title: 'New Paragraph Before Cursor',
                command: {
                    // commandID: CommandID.NewParagraphBefore,
                    commandID: "",
                },
            },
            {
                group: '3_paragraph',
                title: 'New Paragraph After Cursor',
                command: {
                    // commandID: CommandID.NewParagraphAfter,
                    commandID: "",
                },
            },
        ];

        for (const item of insertMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarInsert, item);
        }

        // Register 'Heading' submenu items
        const headingMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_heading',
                title: 'Heading 1',
                command: {
                    // commandID: CommandID.InsertHeading1,
                    commandID: "",
                },
            },
            {
                group: '1_heading',
                title: 'Heading 2',
                command: {
                    // commandID: CommandID.InsertHeading2,
                    commandID: "",
                },
            },
            {
                group: '1_heading',
                title: 'Heading 3',
                command: {
                    // commandID: CommandID.InsertHeading3,
                    commandID: "",
                },
            },
            {
                group: '1_heading',
                title: 'Heading 4',
                command: {
                    // commandID: CommandID.InsertHeading4,
                    commandID: "",
                },
            },
            {
                group: '1_heading',
                title: 'Heading 5',
                command: {
                    // commandID: CommandID.InsertHeading5,
                    commandID: "",
                },
            },
            {
                group: '1_heading',
                title: 'Heading 6',
                command: {
                    // commandID: CommandID.InsertHeading6,
                    commandID: "",
                },
            },
        ];

        for (const item of headingMenuItems) {
            registrant.registerMenuItem(MenuTypes.InsertHeading, item);
        }

        // Register 'List' submenu items
        const listMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_list',
                title: 'Ordered List',
                command: {
                    // commandID: CommandID.InsertOrderedList,
                    commandID: "",
                },
            },
            {
                group: '1_list',
                title: 'Unordered List',
                command: {
                    // commandID: CommandID.InsertUnorderedList,
                    commandID: "",
                },
            },
            {
                group: '1_list',
                title: 'Todo List',
                command: {
                    // commandID: CommandID.InsertTodoList,
                    commandID: "",
                },
            },
        ];

        for (const item of listMenuItems) {
            registrant.registerMenuItem(MenuTypes.InsertList, item);
        }

        // Register 'Image' submenu items
        const imageMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_image',
                title: 'Insert Empty Image',
                command: {
                    // commandID: CommandID.InsertEmptyImage,
                    commandID: "",
                },
            },
            {
                group: '1_image',
                title: 'Insert Local Image…',
                command: {
                    // commandID: CommandID.InsertLocalImage,
                    commandID: "",
                },
            },
            // Separator
            {
                group: '2_image_ops',
                title: 'Reveal Image In Finder/Explorer',
                command: {
                    // commandID: CommandID.RevealImageInExplorer,
                    commandID: "",
                },
            },
            {
                group: '2_image_ops',
                title: 'Zoom Image',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertImageZoom,
            },
            {
                group: '2_image_ops',
                title: 'Switch Image Syntax',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertImageSwitchSyntax,
            },
            // Separator
            {
                group: '3_image_management',
                title: 'Delete Image File…',
                command: {
                    // commandID: CommandID.DeleteImageFile,
                    commandID: "",
                },
            },
            {
                group: '3_image_management',
                title: 'Copy Image To…',
                command: {
                    // commandID: CommandID.CopyImageTo,
                    commandID: "",
                },
            },
            {
                group: '3_image_management',
                title: 'Move Image To…',
                command: {
                    // commandID: CommandID.MoveImageTo,
                    commandID: "",
                },
            },
            // Separator
            {
                group: '4_image_batch',
                title: 'Copy All Images to…',
                command: {
                    // commandID: CommandID.CopyAllImagesTo,
                    commandID: "",
                },
            },
            {
                group: '4_image_batch',
                title: 'Move All Images to…',
                command: {
                    // commandID: CommandID.MoveAllImagesTo,
                    commandID: "",
                },
            },
        ];

        for (const item of imageMenuItems) {
            registrant.registerMenuItem(MenuTypes.InsertImage, item);
        }

        // Register 'Zoom Image' submenu items
        const zoomImageMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_zoom_levels',
                title: '25%',
                command: {
                    // commandID: CommandID.ZoomImage25,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '33%',
                command: {
                    // commandID: CommandID.ZoomImage33,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '50%',
                command: {
                    // commandID: CommandID.ZoomImage50,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '66%',
                command: {
                    // commandID: CommandID.ZoomImage66,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '80%',
                command: {
                    // commandID: CommandID.ZoomImage80,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '100%',
                command: {
                    // commandID: CommandID.ZoomImage100,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '150%',
                command: {
                    // commandID: CommandID.ZoomImage150,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '200%',
                command: {
                    // commandID: CommandID.ZoomImage200,
                    commandID: "",
                },
            },
            {
                group: '1_zoom_levels',
                title: '500%',
                command: {
                    // commandID: CommandID.ZoomImage500,
                    commandID: "",
                },
            },
        ];

        for (const item of zoomImageMenuItems) {
            registrant.registerMenuItem(MenuTypes.InsertImageZoom, item);
        }

        // Register 'Switch Image Syntax' submenu items
        const switchImageSyntaxMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_syntax',
                title: 'Markdown Syntax',
                command: {
                    // commandID: CommandID.SwitchImageToMarkdown,
                    commandID: "",
                },
            },
            {
                group: '1_syntax',
                title: 'HTML Syntax',
                command: {
                    // commandID: CommandID.SwitchImageToHTML,
                    commandID: "",
                },
            },
        ];

        for (const item of switchImageSyntaxMenuItems) {
            registrant.registerMenuItem(MenuTypes.InsertImageSwitchSyntax, item);
        }
    }
);

// Format Menu
export const menuTitleFormatRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleFormatRegister',
    (registrant) => {
        const formatMenuItems: IMenuItemRegistration[] = [
            // Text Formatting
            {
                group: '1_text',
                title: 'Strong',
                command: {
                    // commandID: CommandID.FormatStrong,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+B' : 'Ctrl+B',
                },
            },
            {
                group: '1_text',
                title: 'Emphasis',
                command: {
                    // commandID: CommandID.FormatEmphasis,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+I' : 'Ctrl+I',
                },
            },
            {
                group: '1_text',
                title: 'Underline',
                command: {
                    // commandID: CommandID.FormatUnderline,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+U' : 'Ctrl+U',
                },
            },
            {
                group: '1_text',
                title: 'Inline Code',
                command: {
                    // commandID: CommandID.FormatInlineCode,
                    commandID: "",
                },
            },
            {
                group: '1_text',
                title: 'Inline Math',
                command: {
                    // commandID: CommandID.FormatInlineMath,
                    commandID: "",
                },
            },
            {
                group: '1_text',
                title: 'Strike',
                command: {
                    // commandID: CommandID.FormatStrike,
                    commandID: "",
                },
            },
            {
                group: '1_text',
                title: 'Hyperlink',
                command: {
                    // commandID: CommandID.InsertHyperlink,
                    commandID: "",
                },
            },
            // Image Formatting
            {
                group: '2_image',
                title: 'Image',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.FormatImage,
            },
        ];

        for (const item of formatMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarFormat, item);
        }

        // Register 'Image' submenu items for Format menu
        const formatImageMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_image_ops',
                title: 'Reveal Image In Finder/Explorer',
                command: {
                    // commandID: CommandID.RevealImageInExplorer,
                    commandID: "",
                },
            },
            {
                group: '1_image_ops',
                title: 'Zoom Image',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertImageZoom,
            },
            {
                group: '1_image_ops',
                title: 'Switch Image Syntax',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.InsertImageSwitchSyntax,
            },
        ];

        for (const item of formatImageMenuItems) {
            registrant.registerMenuItem(MenuTypes.FormatImage, item);
        }
    }
);

// View Menu
export const menuTitleViewRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleViewRegister',
    (registrant) => {
        const viewMenuItems: IMenuItemRegistration[] = [
            // Command Palette and Theme
            {
                group: '1_tools',
                title: 'Command Palette',
                command: {
                    // commandID: CommandID.CommandPalette,
                    commandID: "",
                    keybinding: IS_MAC ? 'Shift+Cmd+P' : 'Ctrl+Shift+P',
                },
            },
            {
                group: '1_tools',
                title: 'Change Theme',
                command: {
                    commandID: "",
                },
                submenu: MenuTypes.ViewChangeTheme,
            },
            // Separator
            // View Toggles
            {
                group: '2_view',
                title: 'Always On Top',
                command: {
                    // commandID: CommandID.ToggleAlwaysOnTop,
                    commandID: "",
                },
                // // checkbox: true,
            },
            {
                group: '2_view',
                title: 'Toggle Full Screen',
                command: {
                    // commandID: CommandID.ToggleFullScreen,
                    commandID: "",
                    keybinding: IS_MAC ? 'Ctrl+Cmd+F' : 'F11',
                },
            },
            {
                group: '2_view',
                title: 'Toggle Outline',
                command: {
                    // commandID: CommandID.ToggleOutline,
                    commandID: "",
                },
            },
            {
                group: '2_view',
                title: 'Toggle Typewriter Mode',
                command: {
                    // commandID: CommandID.ToggleTypewriterMode,
                    commandID: "",
                },
            },
            // Separator
            // Mode Toggles
            {
                group: '3_mode',
                title: 'Source Code Mode',
                command: {
                    // commandID: CommandID.ToggleSourceCodeMode,
                    commandID: "",
                },
                // checkbox: true,
            },
            {
                group: '3_mode',
                title: 'Split View Mode',
                command: {
                    // commandID: CommandID.ToggleSplitViewMode,
                    commandID: "",
                },
                // checkbox: true,
            },
            {
                group: '3_mode',
                title: 'Rich Text Mode',
                command: {
                    // commandID: CommandID.ToggleRichTextMode,
                    commandID: "",
                },
                // checkbox: true,
            },
            // Separator
            // Zoom Operations
            {
                group: '4_zoom',
                title: 'Zoom In',
                command: {
                    // commandID: CommandID.ZoomIn,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+=' : 'Ctrl+=',
                },
            },
            {
                group: '4_zoom',
                title: 'Zoom Out',
                command: {
                    // commandID: CommandID.ZoomOut,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+-' : 'Ctrl+-',
                },
            },
            {
                group: '4_zoom',
                title: 'Zoom Reset',
                command: {
                    // commandID: CommandID.ZoomReset,
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+0' : 'Ctrl+0',
                },
            },
        ];

        for (const item of viewMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarView, item);
        }

        // Register 'Change Theme' submenu items
        const changeThemeMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_themes',
                title: 'Light Theme Default',
                command: {
                    // commandID: CommandID.SelectLightTheme,
                    commandID: "",
                },
            },
            {
                group: '1_themes',
                title: 'Dark Theme Default',
                command: {
                    // commandID: CommandID.SelectDarkTheme,
                    commandID: "",
                },
            },
            // Separator
            {
                group: '2_dynamic',
                title: 'DYNAMIC',
                command: {
                    commandID: "",
                },
            },
            // Separator
            {
                group: '3_folder',
                title: 'Open Theme Folder',
                command: {
                    // commandID: CommandID.OpenThemeFolder,
                    commandID: "",
                },
            },
        ];

        for (const item of changeThemeMenuItems) {
            registrant.registerMenuItem(MenuTypes.ViewChangeTheme, item);
        }
    }
);

// Help Menu
export const menuTitleHelpRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleHelpRegister',
    (registrant) => {
        const helpMenuItems: IMenuItemRegistration[] = [
            // Resources
            {
                group: '1_resources',
                title: 'Home Page',
                command: {
                    // commandID: CommandID.OpenHomePage,
                    commandID: "",
                },
            },
            {
                group: '1_resources',
                title: 'Get Started',
                command: {
                    // commandID: CommandID.GetStarted,
                    commandID: "",
                },
            },
            {
                group: '1_resources',
                title: 'Tips and Tricks',
                command: {
                    // commandID: CommandID.TipsAndTricks,
                    commandID: "",
                },
            },
            {
                group: '1_resources',
                title: 'Show Release Notes',
                command: {
                    // commandID: CommandID.ShowReleaseNotes,
                    commandID: "",
                },
            },
            // Separator
            // Feedback
            {
                group: '2_feedback',
                title: 'Report Issues or Bugs',
                command: {
                    // commandID: CommandID.ReportIssue,
                    commandID: "",
                },
            },
            {
                group: '2_feedback',
                title: 'Request New Feature',
                command: {
                    // commandID: CommandID.RequestFeature,
                    commandID: "",
                },
            },
            // Separator
            // License and Tools
            {
                group: '3_info',
                title: 'View License',
                command: {
                    // commandID: CommandID.ViewLicense,
                    commandID: "",
                },
            },
            // Separator
            {
                group: '4_tools',
                title: 'Toggle Developer Tool',
                command: {
                    // commandID: CommandID.ToggleDevTools,
                    commandID: "",
                    keybinding: IS_MAC ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                },
            },
            {
                group: '4_tools',
                title: 'Toggle Inspector Tool',
                command: {
                    // commandID: CommandID.ToggleInspectorTool,
                    commandID: "",
                },
            },
            // Separator
            // Updates and About
            {
                group: '5_updates',
                title: 'Check For Updates…',
                command: {
                    // commandID: CommandID.CheckForUpdates,
                    commandID: "",
                },
            },
            {
                group: '5_updates',
                title: 'About…',
                command: {
                    // commandID: CommandID.About,
                    commandID: "",
                },
            },
        ];

        for (const item of helpMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarHelp, item);
        }
    }
);
