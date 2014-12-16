( function ( mw, $, oo ) {
	var FTP;

	/**
	 * Represents a "transport" for files to upload; in this case using Firefogg.
	 * @class mw.FirefoggTransport
	 * @mixins OO.EventEmitter
	 * @constructor
	 * @param {File} file
	 * @param {mw.Api} api
	 * @param {Firefogg} fogg Firefogg instance
	 */
	mw.FirefoggTransport = function ( file, api, fogg ) {
		oo.EventEmitter.call( this );

		this.fileToUpload = file;
		this.api = api;
		this.fogg = fogg;
	};

	oo.mixinClass( mw.FirefoggTransport, oo.EventEmitter );

	FTP = mw.FirefoggTransport.prototype;

	/**
	 * Do an upload
	 */
	FTP.doUpload = function () {
		var fileToUpload = this.fileToUpload, transport = this;

		//Encode or passthrough Firefogg before upload
		if ( this.isUploadFormat() ) {
			this.doFormDataUpload( fileToUpload );
		} else {
			this.emit( 'encoding' );
			this.fogg.encode( JSON.stringify( this.getEncodeSettings() ),
				function (result, file) {
					result = JSON.parse(result);
					if ( result.progress === 1 ) {
						//encoding done
						transport.doFormDataUpload(file);
					} else {
						//encoding failed
						var response = {
							error: {
								code: 500,
								info: 'Encoding failed'
							}
						};

						transport.emit( 'transported', response );
					}
				}, function ( progress ) { //progress
					transport.emit( 'progress', JSON.parse( progress ) );
				}
			);
		}
	};

	FTP.doFormDataUpload = function ( file ) {
		this.emit( 'starting', file );
	};

	/**
	 * Check if the asset is in a format that can be upload without encoding.
	 */
	FTP.isUploadFormat = function () {
		// Check if the server supports webm uploads:
		var wembExt = ( $.inArray( 'webm', mw.UploadWizard.config.fileExtensions ) !== -1 );
		// Determine passthrough mode
		if ( this.isOggFormat() || ( wembExt && this.isWebMFormat() ) ) {
			// Already Ogg, no need to encode
			return true;
		} else if ( this.isSourceAudio() || this.isSourceVideo() ) {
			// OK to encode
			return false;
		} else {
			// Not audio or video, can't encode
			return true;
		}
	};

	// TODO these boolean functions could be compressed and/or simplified, it looks like
	FTP.isSourceAudio = function () {
		var info = this.getSourceFileInfo();
		// never transcode images
		if ( info.contentType.indexOf( 'image/' ) !== -1 ) {
			return false;
		}
		return ( ( !info.video || info.video.length === 0 ) && info.audio.length > 0 ) ||
				info.contentType.indexOf( 'audio/' ) !== -1;
	};

	FTP.isSourceVideo = function () {
		var info = this.getSourceFileInfo();
		// never transcode images
		if ( info.contentType.indexOf( 'image/' ) !== -1 ) {
			return false;
		}
		return ( info.video && info.video.length > 0 && info.video[0].duration > 0.04 ) ||
			info.contentType.indexOf( 'video/' ) !== -1;
	};

	FTP.isOggFormat = function () {
		var contentType = this.getSourceFileInfo().contentType;
		return contentType.indexOf( 'video/ogg' ) !== -1 ||
			contentType.indexOf( 'application/ogg' ) !== -1 ||
			contentType.indexOf( 'audio/ogg') !== -1;
	};

	FTP.isWebMFormat = function () {
		return ( this.getSourceFileInfo().contentType.indexOf('webm') !== -1 );
	};

	/**
	 * Get the source file info for the current file selected into this.fogg
	 */
	FTP.getSourceFileInfo = function () {
		if ( !this.fogg.sourceInfo ) {
			mw.log.warn( 'No firefogg source info is available' );
			return false;
		}
		try {
			this.sourceFileInfo = JSON.parse( this.fogg.sourceInfo );
		} catch ( e ) {
			mw.log.warn( 'Could not parse fogg sourceInfo' );
			return false;
		}
		return this.sourceFileInfo;
	};

	// Get the filename
	FTP.getFileName = function () {
		// If file is in a supported format don't change extension
		if ( this.isUploadFormat() ) {
			return this.fogg.sourceFilename;
		} else {
			if ( this.isSourceAudio() ) {
				return this.fogg.sourceFilename.split('.').slice(0, -1).join('.') + '.oga';
			}
			if ( this.isSourceVideo() ) {
				var ext = this.getEncodeExt();
				return this.fogg.sourceFilename.split('.').slice(0, -1).join('.') + '.' + ext;
			}
		}
	};

	FTP.getEncodeExt = function () {
		var encodeSettings = mw.UploadWizard.config.firefoggEncodeSettings;
		if ( encodeSettings.videoCodec && encodeSettings.videoCodec === 'vp8' ) {
			return 'webm';
		} else {
			return 'ogv';
		}
	};

	/**
	 * Get the encode settings from configuration and the current selected video type
	 */
	FTP.getEncodeSettings = function () {
		if ( this.isUploadFormat() ) {
			return { passthrough:true };
		}
		// Get the default encode settings:
		var encodeSettings = mw.UploadWizard.config.firefoggEncodeSettings;
		// Update the format:
		this.fogg.setFormat( ( this.getEncodeExt() === 'webm' ) ? 'webm' : 'ogg' );

		mw.log( 'FirefoggTransport::getEncodeSettings> ' +  JSON.stringify(  encodeSettings ) );
		return encodeSettings;
	};
}( mediaWiki, jQuery, OO ) );
