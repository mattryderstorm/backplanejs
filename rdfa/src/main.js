//= require <core>
//= require "RDFParser"
//= require "RDFStore"
//= require "RDFQuery"
//= require "fresnel"
//= provide "../assets"

/**
 * The RDFa Parsing Module provides utilities for parsing RDFa from a DOM
 * and placing the resulting triples into a queryable triple-store.
 *
 * @module RDFa
 * @title RDFa parsing module
 * @requires core
 */

/**
 * This is a made up class for now, to help YUI Doc.
 *
 * @class RDFa
 */

/*
 * Create a triple store to put all the triples into.
 */

if (!document.meta) {
	document.meta = new RDFQuery( new RDFStore() );
	document.Yowl.register(
		"RDFa Parser",
		[ "Parsing status" ],
		[ 0 ],
		null
	);
}

/**
 * Establish whether the document is running in a side-bar or the main browser window.
 *
 * @method getMainDoc
 */

var oDoc = getMainDoc();

function getMainDoc() {

	/*
	 * See if we're in a UBX side-bar
	 */

	if (window.external && window.external.document) {
		return window.external.document;
	} else if (window.parent) {
		return window.parent.document;
	}
	return window.document;
}

YAHOO.util.Event.onDOMReady(
function () {

	/*
	 * Create a parser, and give it access to the triple store.
	 */

	var oParser = new RDFParser(document.meta.store);


	/*
	 * If we're running as a bookmarklet, then load a default formatter.
	 */

	if (document.runContext === "bookmarklet") {
		document.meta.store.insert(
			[
				{
					"http://argot-hub.googlecode.com/formatter": "<http://ubiquity-rdfa.googlecode.com/svn/trunk/_samples/formats/debug>"
				}
			]
		);
	}

	/*
	 * Parse the document for triples. Note that we are parsing either 'this' document
	 * or an external document if we are in a sidebar, but the results always go to
	 * 'this' document.
	 */

	oParser.parse(oDoc, getBaseUrl(oDoc), null);

	var pThis = oParser;

	spawn(
		function()
		{
			if (document.meta.store.loadFormatters) {
				document.meta.store.loadFormatters("", oParser);
			}

			/*
			 * Register any formatters.
			 */

			var loader = new YAHOO.util.YUILoader();
			var r = document.meta.query2(
				{
					select: [ "formatter" ],
					where:
						[
							{ pattern: [ "?s", "http://argot-hub.googlecode.com/formatter", "?formatter" ] }
						]
				}
			);
			var uriFormatter;

			if (r && r.results.bindings[0] && r.results.bindings[0]["formatter"])
			{
				uriFormatter = r.results.bindings[0]["formatter"];

				loader.addModule({ name: "fresnel-formatter-css", type: "css", fullpath: r.results.bindings[0]["formatter"] + ".css" });
				loader.addModule({ name: "fresnel-formatter", type: "js", fullpath: r.results.bindings[0]["formatter"] + ".js",
					requires: [ "fresnel-formatter-css" ] });

				loader.require( "fresnel-formatter" );

				loader.onSuccess = function(o) {
					var loader = new YAHOO.util.YUILoader();
					var r = document.meta.query2(
						{
							select: [ "css" ],
							where:
								[
									{ pattern: [ "?s", "http://www.w3.org/1999/xhtml/vocab#stylesheet", "?css" ] }
								]
						}
					);//query for any stylesheets

					if (r && r.results.bindings[0] && r.results.bindings[0]["css"])
					{
						loader.addModule({ name: "fresnel-css-stylesheet", type: "css", fullpath: r.results.bindings[0]["css"] });
						if (window.external && window.external.document)
						{
							var d = window.external.document;
							var h = d.getElementsByTagName("head")[0];
							var l = d.createElement("link");

							l.setAttribute("rel", "stylesheet");
							l.setAttribute("href", r.results.bindings[0]["css"]);
							h.appendChild(l);
						}
					}
					loader.insert();
					if (window.external && window.external.document) {
						oParser.parse(window.external.document, getBaseUrl(window.external.document), null);
					}
					processFresnelSelectors( uriFormatter );
					return;
				};//onSuccess;
			}//if there are some formatters to load
			else {
				initialiseFresnelFormats(oParser);
			}
			loader.insert();
			return;
		},
		null
	);
	return;
}//get_metadata()
);
