/*
 * This file is part of the MediaWiki extension UploadWizard.
 *
 * UploadWizard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * UploadWizard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with UploadWizard.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $, ui, oo ) {
	var TP;

	/**
	 * Represents the UI for the wizard's Thanks step.
	 * @class uw.ui.Thanks
	 * @extends mw.uw.ui.Step
	 * @constructor
	 */
	function Thanks( config ) {
		var $header,
			beginButtonTarget,
			thanks = this;

		this.config = config;

		ui.Step.call(
			this,
			$( '#mwe-upwiz-stepdiv-thanks' ),
			$( '#mwe-upwiz-step-thanks' )
		);

		$( '<p>' )
			.addClass( 'mwe-upwiz-thanks-explain' )
			.msg( 'mwe-upwiz-thanks-explain' )
			.prependTo( this.$div );

		$header = $( '<h3>' )
			.addClass( 'mwe-upwiz-thanks-header' )
			.prependTo( this.$div );

		if ( !mw.UploadWizard.config || !mw.UploadWizard.config.display || !mw.UploadWizard.config.display.thanksLabel ) {
			$header.text( mw.message( 'mwe-upwiz-thanks-intro' ).text() );
		} else {
			$header.html( mw.UploadWizard.config.display.thanksLabel );
		}

		this.$buttons = this.$div.find( '.mwe-upwiz-buttons' );

		this.homeButton = new oo.ui.ButtonWidget( {
			label: this.getButtonConfig( 'homeButton', 'label' ) || mw.message( 'mwe-upwiz-home' ).text(),
			href: this.getButtonConfig( 'homeButton', 'target' ) || mw.config.get( 'wgArticlePath' ).replace( '$1', '' )
		} );

		this.beginButton = new oo.ui.ButtonWidget( {
			label: this.getButtonConfig( 'beginButton', 'label' ) ||  mw.message( 'mwe-upwiz-upload-another' ).text(),
			flags: [ 'progressive', 'primary' ]
		} );

		// TODO: make the step order configurable by campaign definitions instead of using these hacks
		beginButtonTarget = this.getButtonConfig( 'beginButton', 'target' );
		if ( !beginButtonTarget ) {
			this.beginButton.on( 'click', function () {
				thanks.emit( 'next-step' );
			} );
		} else {
			if ( beginButtonTarget === 'dropObjref' ) {
				beginButtonTarget = this.dropParameterFromURL( location.href, 'updateList' );
			}
			this.beginButton.setHref( beginButtonTarget );
		}

		this.buttonGroup = new oo.ui.HorizontalLayout( {
			items: [ this.homeButton, this.beginButton ]
		} );

		this.$buttons.append( this.buttonGroup.$element );
	}

	oo.inheritClass( Thanks, ui.Step );

	TP = Thanks.prototype;

	/**
	 * Adds an upload to the Thanks interface.
	 * @param {mw.UploadWizardUpload} upload
	 */
	TP.addUpload = function ( upload ) {
		if ( upload === undefined ) {
			return;
		}

		var thumbWikiText = '[[' + [
				upload.title.toText(),
				'thumb',
				upload.details.descriptions[0].getDescriptionText()
			].join( '|' ) + ']]',

			$thanksDiv = $( '<div>' )
				.addClass( 'mwe-upwiz-thanks ui-helper-clearfix' ),
			$thumbnailWrapDiv = $( '<div>' )
				.addClass( 'mwe-upwiz-thumbnail-side' )
				.appendTo( $thanksDiv ),
			$thumbnailDiv = $( '<div>' )
				.addClass( 'mwe-upwiz-thumbnail' )
				.appendTo( $thumbnailWrapDiv ),
			$thumbnailCaption = $( '<div>' )
				.css( { 'text-align': 'center', 'font-size': 'small' } )
				.appendTo( $thumbnailWrapDiv ),
			$thumbnailLink = $( '<a>' )
				.text( upload.title.getMainText() )
				.appendTo( $thumbnailCaption );

		$( '<div>' )
			.addClass( 'mwe-upwiz-data' )
			.appendTo( $thanksDiv )
			.append(
				$( '<p>' )
					.text( mw.message( 'mwe-upwiz-thanks-wikitext' ).text() )
					.append(
						$( '<br />' ),
						this.makeReadOnlyInput( thumbWikiText )
					),
				$('<p/>').text( mw.message( 'mwe-upwiz-thanks-url' ).text() )
					.append(
						$( '<br />' ),
						this.makeReadOnlyInput( upload.imageinfo.descriptionurl )
					)
			);

		upload.setThumbnail(
			$thumbnailDiv,
			mw.UploadWizard.config.thumbnailWidth,
			mw.UploadWizard.config.thumbnailMaxHeight,
			false
		);

		// Set the thumbnail links so that they point to the image description page
		$thumbnailLink.add( $thumbnailDiv.find( '.mwe-upwiz-thumbnail-link' ) ).attr( {
			href:upload.imageinfo.descriptionurl,
			target:'_blank'
		} );

		this.$div.find( '.mwe-upwiz-buttons' ).before( $thanksDiv );
	};

	/**
	 * Make a read only text input, which self-selects on gaining focus
	 * @param {string} text it will contain
	 * @return {jQuery}
	 */
	TP.makeReadOnlyInput = function ( s ) {
		return $( '<input>' )
			.addClass( 'mwe-title ui-corner-all' )
			.readonly()
			.val( s )
			.click( function () {
				this.focus();
				this.select();
			} );
	};

	/**
	 * Empty out all upload information.
	 */
	TP.empty = function () {
		this.$div.find( '.mwe-upwiz-thanks' ).remove();
	};

	/**
	 * Get button configuration options from a campaign definition
	 * @param {string} buttonName name of the button as defined in campaign configuration
	 * @param {string} configField name of the button's attributes
	 * @return {Object|undefined}
	 */
	TP.getButtonConfig = function ( buttonName, configField ) {
		if ( !this.config || !this.config.display || !this.config.display[buttonName] ) {
			return;
		}

		return this.config.display[buttonName][configField];
	};

	/**
	 * Drops a parameter from the given url
	 * @param url
	 * @param paramName parameter to be dropped
	 * @return {string}
	 * @private
	 */
	TP.dropParameterFromURL = function ( url, paramName ) {
		var newUrl = new mw.Uri( url );
		if ( newUrl.query ) {
			delete newUrl.query[paramName];
			delete newUrl.query[paramName + '[]'];
		}
		return newUrl.toString();
	};

	ui.Thanks = Thanks;
}( mediaWiki, jQuery, mediaWiki.uploadWizard.ui, OO ) );
