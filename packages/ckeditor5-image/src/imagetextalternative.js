/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module image/imagetextalternative
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ImageTextAlternativeEngine from './imagetextalternative/imagetextalternativeengine';
import escPressHandler from '@ckeditor/ckeditor5-ui/src/bindings/escpresshandler';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import ImageToolbar from './imagetoolbar';
import TextAlternativeFormView from './imagetextalternative/ui/textalternativeformview';
import ImageBalloonPanel from './image/ui/imageballoonpanelview';

import textAlternativeIcon from '@ckeditor/ckeditor5-core/theme/icons/low-vision.svg';
import '../theme/imagetextalternative/theme.scss';

/**
 * The image text alternative plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageTextAlternative extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageTextAlternativeEngine ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageTextAlternative';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this._createButton();

		const panel = this._createBalloonPanel();

		/**
		 * Balloon panel containing text alternative change form.
		 *
		 * @member {module:image/image/ui/imageballoonpanel~ImageBalloonPanelView} #baloonPanel
		 */
		this.balloonPanel = panel;

		/**
		 * Form containing textarea and buttons, used to change `alt` text value.
		 *
		 * @member {module:image/imagetextalternative/ui/textalternativeformview~TextAlternativeFormView} #form
		 */
		this.form = panel.content.get( 0 );
	}

	/**
	 * Creates button showing text alternative change balloon panel and registers it in
	 * editor's {@link module:ui/componentfactory~ComponentFactory ComponentFactory}.
	 *
	 * @private
	 */
	_createButton() {
		const editor = this.editor;
		const command = editor.commands.get( 'imageTextAlternative' );
		const t = editor.t;

		editor.ui.componentFactory.add( 'imageTextAlternative', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Change image text alternative' ),
				icon: textAlternativeIcon,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command, 'isEnabled' );

			this.listenTo( view, 'execute', () => this._showBalloonPanel() );

			return view;
		} );
	}

	/**
	 * Creates balloon panel.
	 *
	 * @private
	 * @return {module:image/image/ui/imageballoonpanel~ImageBalloonPanelView}
	 */
	_createBalloonPanel() {
		const editor = this.editor;

		const panel = new ImageBalloonPanel( editor );
		const form = new TextAlternativeFormView( editor.locale );

		this.listenTo( form, 'submit', () => {
			editor.execute( 'imageTextAlternative', { newValue: form.labeledInput.inputView.element.value } );
			this._hideBalloonPanel();
		} );

		// If image toolbar is present - hide it when text alternative balloon is visible.
		const imageToolbar = editor.plugins.get( ImageToolbar );

		if ( imageToolbar ) {
			this.listenTo( panel, 'change:isVisible', () => {
				if ( panel.isVisible ) {
					imageToolbar.hide();
					imageToolbar.isEnabled = false;
				} else {
					imageToolbar.show();
					imageToolbar.isEnabled = true;
				}
			} );
		}

		this.listenTo( form, 'cancel', () => this._hideBalloonPanel() );

		// Close on `ESC` press.
		escPressHandler( {
			emitter: panel,
			activator: () => panel.isVisible,
			callback: () => this._hideBalloonPanel()
		} );

		// Close on click outside of balloon panel element.
		clickOutsideHandler( {
			emitter: panel,
			activator: () => panel.isVisible,
			contextElements: [ panel.element ],
			callback: () => this._hideBalloonPanel()
		} );

		panel.content.add( form );
		editor.ui.view.body.add( panel );

		return panel;
	}

	/**
	 * Shows the balloon panel.
	 *
	 * @private
	 */
	_showBalloonPanel() {
		const editor = this.editor;
		const command = editor.commands.get( 'imageTextAlternative' );
		const labeledInput = this.form.labeledInput;
		this.balloonPanel.attach();

		// Make sure that each time the panel shows up, the field remains in sync with the value of
		// the command. If the user typed in the input, then canceled the balloon (`labeledInput#value`
		// stays unaltered) and re-opened it without changing the value of the command, they would see the
		// old value instead of the actual value of the command.
		// https://github.com/ckeditor/ckeditor5-image/issues/114
		labeledInput.value = labeledInput.inputView.element.value = command.value || '';

		this.form.labeledInput.select();
	}

	/**
	 * Hides the balloon panel.
	 *
	 * @private
	 */
	_hideBalloonPanel() {
		const editor = this.editor;
		this.balloonPanel.detach();
		editor.editing.view.focus();
	}
}
