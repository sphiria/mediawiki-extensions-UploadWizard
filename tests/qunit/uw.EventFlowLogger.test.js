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

( function ( mw, uw ) {
	QUnit.module( 'uw.EventFlowLogger', QUnit.newMwEnvironment() );

	QUnit.test( 'sanity test', 1, function ( assert ) {
		var eventLog = { logEvent: this.sandbox.stub() },
			logger = new uw.EventFlowLogger( eventLog );

		logger.logStep( 'foo' );
		logger.logSkippedStep( 'bar' );
		logger.logEvent( 'baz' );
		assert.ok( eventLog.logEvent.calledThrice, 'all steps were logged' );
	} );
} ( mediaWiki, mediaWiki.uploadWizard ) );
