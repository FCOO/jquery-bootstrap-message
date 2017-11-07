/****************************************************************************
	promise.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-message
	https://github.com/FCOO




****************************************************************************/

(function ($, window, Promise/*, document, undefined*/) {
	"use strict";

    //Convert a reason to error-object
    Promise.convertReasonToError = function( reason ){
        var result = new Error(),
            response = reason ? reason.response || {} : {};

        result.name    = 'Error';
        result.message = reason.message || '';
        result.url     = response.url || '';
        result.status  = response.status || '';
//TODO            error.responseText = ???
        return result;
    };

    //Create a default error-handle. Can be overwritten
    Promise.defaultErrorHandler = Promise.defaultErrorHandler || function( /* reason */ ){
    };

    //Set event handler for unhandled rejections
    window.onunhandledrejection = function(e){
        if (e && e.preventDefault)
            e.preventDefault();

        if (e && e.detail)
            //Call default error handler
            Promise.defaultErrorHandler( e.detail.reason || {} );
    };

    /**************************************************************
    Promise.fetch( url, options )
    Fetch the url.
    Retries up to options.retries times with delay between of options.retryDeday ms
    **************************************************************/
    Promise.fetch = function(url, options) {
        options = $.extend( {}, {
            retries   : 3,
            retryDelay: 1000,
            cache     : 'reload',  //TODO: Check if it works
            headers   : {
                "Cache-Control": 'no-cache'    //TODO: Check if this works
            }
        }, options || {});

        return new Promise(function(resolve, reject) {
            var wrappedFetch = function(n) {
                fetch(url, options)
                    .then(function(response) {
                        resolve(response);
                    })
                    .catch(function(error) {
                        if (n > 0) {
                            setTimeout(function() {
                                wrappedFetch(--n);
                            }, options.retryDelay);
                        }
                        else {
                            reject(error);
                        }
                    });
            };
            wrappedFetch(options.retries);
        });
    };



    /**************************************************************
    Promise.get( url, options[, resolve[, reject[, finally]]] )
    Get the file at url.

    resolve || options.resolve || options.done = function( response )
    reject  || options.reject || options.fail = function( error )
    finally || options.finally || options.always = function( ?? )

    options
        retry: 0
        context: null
        format: null (text,json, xml)
        useDefaultErrorHandler: true => use defaultErrorHandler if no reject-function is given

    **************************************************************/
    function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        }
        else {
            var error = new Error(response.statusText);
            error.response = response;
            throw error;
        }
    }

    /*
    // Cross-browser xml parsing from jQuery
    jQuery.parseXML = function( data ) {
	    var xml, tmp;
    	if ( !data || typeof data !== "string" ) {
	    	return null;
    	}

    	// Support: IE9
	    try {
		    tmp = new DOMParser();
    		xml = tmp.parseFromString( data, "text/xml" );
	    } catch ( e ) {
		    xml = undefined;
	    }

    	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
	    	jQuery.error( "Invalid XML: " + data );
	    }
	    return xml;
    };
*/


    Promise.get = function(url, options, resolve, reject, fin) {
        options = $.extend({}, {
            //Default options
            useDefaultErrorHandler: true,
            retries               : 0
        }, options || {} );


        resolve = resolve || options.resolve || options.done;
        reject  = reject  || options.reject  || options.fail;
        fin     = fin     || options.finally || options.always;

        if (options.context){
            resolve = resolve ? $.proxy( resolve, options.context ) : null;
            reject = reject   ? $.proxy( reject,  options.context ) : null;
            fin    = fin      ? $.proxy( fin,     options.context ) : null;
        }

        var result =
            Promise.fetch(url, options) //Get the file
            .then(checkStatus);         //Check for status of the response

        switch (options.format){
            case 'text':
                result =
                    result
                        .then( function(response) { return response.text(); });
                break;
            case 'json':
                result =
                    result
                        .then( function(response) { return response.text(); })
                        .then( JSON.parse );
                break;
            case 'xml' :
                result =
                    result
                        .then( function(response) { return response.text(); });
                        //TODO .then( convertXML )
                break;
        }

        if (resolve)
            result = result.then( resolve );

        //Adding error/reject promise
        if (reject){
            //If options.useDefaultErrorHandler => also needs to call => Promise.defaultErrorHandler
            if (options.useDefaultErrorHandler)
                result = result.catch( function(){
                    reject.apply( null, arguments );
                    return Promise.defaultErrorHandler.apply( null, arguments );
                });
            else
                //Just use reject as catch
                result = result.catch( reject );

        }
        else {
            if (!options.useDefaultErrorHandler)
                //Prevent the use of Promise.defaultErrorHandler
                result = result.catch( function(){} );

        }

        //Adding finally (if any)
        if (fin)
            result = result.finally( fin );


        return result;
    };

    /**************************************************************
    Promise.getText( url, options[, resolve[, reject[, finally]]] )
    Same as Promise.get with format = 'text'
    **************************************************************/
    Promise.getText = function(url, options, resolve, reject, fin) {
        return Promise.get( url,
                            $.extend( {}, options , { format: 'text' }),
                            resolve, reject, fin );
    };

    /**************************************************************
    Promise.getJSON( url, options[, resolve[, reject[, finally]]] )
    Same as Promise.get with format = 'json'
    **************************************************************/
    Promise.getJSON = function(url, options, resolve, reject, fin) {
        return Promise.get( url,
                            $.extend( {}, options , { format: 'json' }),
                            resolve, reject, fin );
    };



    /******************************************
	Initialize/ready
	*******************************************/
	$(function() { //"$( function() { ... });" is short for "$(document).ready( function(){...});"


	}); //End of initialize/ready
	//******************************************


/* DEMO

    var p1 = new Promise(function(resolve, reject) {
//        console.log('inside ONE');
        //setTimeout(reject, 100, new Error("one-100"));
        setTimeout(resolve, 500, "one-500");
    });
    var p2 = new Promise(function(resolve, reject) {
//        console.log('inside TWO');
        setTimeout(resolve, 1000, "two-1000");
    });

    var p3 = new Promise(function(resolve, reject) {
//        console.log('inside TREE');
        setTimeout(resolve, 800, "tree-800");
    });

    var pList = [p1,p2,p3];

//alert('Set evt offline');


Promise.some( pList, 3)

Promise.any( pList)
    .then(  function( response ){ console.log('any', response); })
    .catch( function( error    ){ console.log('any ERROR', error ); })

Promise.race( pList )
    .then(function( response){ console.log('race', response); })
    .catch( function( error ){ console.log('race ERROR', error ); });


Promise.each( pList, function( response, index, length ){
    console.log('each', response, index, length );
})
.catch( function( error ){
    console.log('each ERROR', error );
});

*/




}(jQuery, this, document, Promise));

