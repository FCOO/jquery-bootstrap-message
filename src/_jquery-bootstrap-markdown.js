/****************************************************************************
	jquery-bootstrap-markdown.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-markdown
	https://github.com/FCOO

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    /******************************************************
    SHOWDOWN
    Creating extensions and setting default options and plugins
    See https://github.com/showdownjs/showdown/wiki/Showdown-Options for details

    ******************************************************/
    var showDownExtensions = [];
    function addExtension( name, ext ){
        window.showdown.extension(name, ext);
        showDownExtensions.push(name);
    }

    //Add extentions to add default class-names to tags.
    const classMap = {
        table: 'table table-striped table-hover table-bordered table-responsive',
        h1    : 'd-none', //Hide header
        //td   : 'text-nowrap'
    };
    addExtension('bindings',
            Object.keys(classMap).map(key => ({
                type: 'output',
                regex: new RegExp(`<${key}`, 'g'),
                replace: `<${key} class="${classMap[key]}"`
            }))
    );

    //Replace all internal href (href="#ID") with a javascript-function to scroll the element into view - prevent hashtags in the main window
    window._showdownScrollToElement = function( _this ){
        var id = $(_this).data('showdownscrollto'),
            $elem = id ? $('#'+id) : null;
        if ($elem && $elem.length)
            $elem.scrollIntoView();
    };
    addExtension('scrollTo',{
        type: 'output',
        regex: /<a href="\#/g,
        replace: '<a href="javascript:undefined" onClick="javascript:_showdownScrollToElement(this);" data-showdownscrollto="'
    });

    //Force all href to go to new window
    addExtension('hrefTarget', {
        type: 'output',
        regex: /<a href="/g,
        replace: '<a target="_blank" href="'
    });

    //Convert all relative paths to absolute path using the path of the md-file
    addExtension('relativetoabsolute', {
        type: 'output',
        filter: function (text, converter/*, options*/) {
            var tags = [
                    {start: 'url(', end:')'},
                    {start: 'src="', end:'"'}
                ],
                path = converter.getOption('url').split('/');
            path.pop();
            path = path.join('/');

            $.each( tags, function( index, tag ){
                var list = text.split( tag.start );
                $.each( list, function( index, subStr ){
                    if (index){
                        var subStrList = subStr.split( tag.end ),
                            url = subStrList[0];

                        //Convert relative url by adding the path of the md-file
                        if (url.indexOf('http') != 0){
                            subStrList[0] = path + (url.charAt(0) == '/' ? '' : '/') + url;
                            list[index] = subStrList.join( tag.end );
                        }
                    }
                });
                text = list.join( tag.start );
            });
            return text;
        }
    });

    //Default showdown options
    var showdownOptions = {
            extensions                          : showDownExtensions,
            simplifiedAutoLink                  : true, //Enable automatic linking in plain text urls
            excludeTrailingPunctuationFromURLs  : true, //Excludes trailing punctuation from autolinked urls
            literalMidWordUnderscores           : true, //Treats underscores in middle of words as literal characters
            strikethrough                       : true, //Enable support for strikethrough syntax
            tables                              : true, //Enable support for tables syntax
            takslists                           : true, //Enable support for GFM takslists
            ghMentions                          : true, //Enable support for github @mentions
            simpleLineBreaks                    : true, //Parse line breaks as <br/> in paragraphs (like GitHub does)
        };


    /******************************************************
    BsMarkdown
    ******************************************************/
    function BsMarkdown( options ) {
		this.options = $.extend({}, {
            header      : '',
            url         : '',
            link        : '',           //Url to standalone version of the file
            languages   : ['en', 'da'], //List of possible language-codes in the md-file. E.q. <da>Dette er på dansk</de><en>This is in English</en>
            language    : 'en',         //Current language-code
            reload      : false,        //If true the file is reloaded every time it is displayed
            fixedContent: null,         //fixed content for the modal-window
            footer      : null,         //footer for the modal-window
            loading     : null,         //Default icon and text displayed in the modal-window during loading
		}, options || {} );


        this.content = '';
        this.$loading =
            this.options.loading ?
                $('<div/>')
                    .addClass('text-center')
                    ._bsAddHtml( this.options.loading )
            : null;
        this.options.language = this.options.language || this.options.languages[0];
    }

    // expose access to the constructor
    $.BsMarkdown = BsMarkdown;

    $.bsMarkdown = function( options ){
        return new $.BsMarkdown( options );
    };

	//Extend the prototype
	$.BsMarkdown.prototype = {

        load: function(){
            var _this = this;

            this.content = '';

            //Add 'loading...' to modal (if any)
            if (this.$modalContainer)
                this.$modalContainer
                    .empty()
                    .append( this.$loading );

            Promise.getText(
                this.options.url, {
                    "resolve": function( content ){ _this.content = content; },
                    "finally": this._onLoad.bind(this)
                }
            );
        },

        _onLoad: function(){
            //If no expected content was loaded => close the modal-window
            if (!this.content){
                this.bsModal.modal('hide');
                return;
            }

            this.$modalContainer.empty();

            //Convert content (if any) to html OR use header as content
            this.converter = this.converter || new window.showdown.Converter(showdownOptions);
            this.converter.setOption('url', this.options.url);

            this.$modalContainer.append(
                this.converter.makeHtml(
                    this._adjustLanguage( this.content, this.options.language )
                )
            );
        },


        //_adjustLanguage - Remove contents in <en>..</en> in danish versions and <da>..</da> in english versions and remove the tags <da> and </da> TODO: Skal gøre de forskellige dele skjulte
        _adjustLanguage: function( src, lang ){

            //Remove contents in <xx>..</xx> where xx is any language-code in options.languages except lang
            $.each( this.options.languages, function( index, language ){
                if (language == lang)
                    return true;

                var startTag = '<' + language + '>',
                    endTag   = '</' + language + '>',
                    list     = src.split( startTag );

                $.each( list, function( index, listItem ){
                    var subList = listItem.split( endTag );
                    if (subList.length > 1)
                        subList = subList.slice(1);
                    list[index] = subList.join( endTag );
                });
                src = list.join( startTag );
            });

            //Remove all language-tags
            $.each( this.options.languages, function( index, language ){
                src = src
                        .split( '<'+language+'>')
                        .join('')
                        .split( '</'+language+'>')
                        .join('');
            });
            return src;
        },


        setLanguage( language ){
            this.options.language  = language;
            if (this.content)
                this.load();
        },


        /**********************************************
        asBsModal - return a bsModal with all messages
        **********************************************/
        asBsModal: function( show ){
            var _this = this;
            this.bsModal =
                this.bsModal ||
                $.bsModal({
                    header  : this.options.header,
                    show    : false,
//                    icons: {
//                        close   : {onClick, attr, className, attr, data }
//                        extend  : {onClick, attr, className, attr, data }
//                        diminish: {onClick, attr, className, attr, data }
//                    }
                    fixedContent : this.options.fixedContent,
                    flex         : true,
//                    noVerticalPadding
                    content      : function( $container ){ _this.$modalContainer = $container; },
                    scroll       : true,
/*
                    extended: {
                        fixedContent
                        flex
                        noVerticalPadding
                        content
                        scroll: boolean | 'vertical' | 'horizontal'
                        footer
                    }
                    isExtended: boolean
*/
                    footer  : this.options.footer,

                    buttons : this.options.link ? [{
                                 icon   : 'fa-external-link',
                                 text   : {da:'Vis i nyt vindue', en:'Show in new window'},
                                 onClick: function(){
                                              var win = window.open(_this.options.link, '_blank');
                                              win.focus();
                                          }
                              }] : [],
//                    closeText

                });

            if (show)
                this.bsModal.show();

            if (!this.content)
                this.load();

            return this.bsModal;
        }


	};

}(jQuery, this, document));
