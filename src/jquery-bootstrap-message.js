/****************************************************************************
	jquery-bootstrap-message.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-message
	https://github.com/FCOO

****************************************************************************/

(function ($ /*, window, document, undefined*/) {
	"use strict";

    function BsMessageGroup( options ) {
		this.options = $.extend(true, {}, {
            id            : '',
            url           : '',
            header        : '',
            icons: {
                envelopeOpen  : 'fa-envelope-open',
                envelopeClosed: 'fa-envelope',
                angleRight    : 'fa-angle-right fa-pull-right fa-border',
                externalLink  : 'fa-external-link-alt',
            },
            reloadPeriod  : '', //period-string with interval for reloading

            convertUrl     : function( url ){ return url; }, //function to convert url (optional)
            onStartLoading : function( /*messageGroup*/){ }, //Called when loading of messages starts
            onFinishLoading: function( /*messageGroup*/){ }, //Called when loading of messages finish
            onErrorLoading : function( /*messageGroup*/){ }, //Called when loading of messages fails

            onCreate  : function( /*messageGroup*/){ },      //Called when group is created
            onChange  : function( /*messageGroup*/){ },      //Called when the status of the group is changed. (Status=nr of messages, no of (un)read merssages)

            loadStatus: function( /*message*/ ){ return true; }, //Return true if the message is read
            saveStatus: function( /*message [,status]*/ ){},     //Save the status for message

            showOnLoad: function( /*message*/ ){ return false; }, //Return true if the message must be shown on load

            sortBy    : 'INDEX', //String or array of string: 'INDEX', 'DATE', STATUS', 'TYPE'
            sortDesc  : false,

            languages   : ['en', 'da'], //List of possible language-codes in the md-file. E.q. <da>Dette er på dansk</de><en>This is in English</en>
            language    : 'en',         //Current language-code

            showType     : false, //If true the type of the messages are shown in the lists
            showStatus   : false, //If true the status of the messages are shown

            showTypeHeader: false, //If true the modal-header of no-file messages are set to type-icon + type-name
            showTypeColor : false, //If true the modal background-color and color of no-file messages get set by the type

            vfFormat  : '',     //Format-id for the date using jquery-value-format. The format must be defined in the application. If vfFormat == '' the date-column isn't shown
            vfOptions : null,   //Optional options for the format vfFormat when displaying the date using jquery-value-format

            loading   : { icon: 'fa-circle-notch fa-spin', text: {da:'Indlæser...', en:'Loading...'}}, //Default icon and text displayed in the modal-window during loading

            dontLoad  : false   //If true the message-group will not load its data on creation

        }, options || {} );

        //Convert url to array of string or objects
        if ($.type(this.options.url) == 'string')
            this.options.url = this.options.url.split(' ');

        if (!$.isArray(this.options.url))
            this.options.url = [this.options.url];

        //convert reloadPeriod to ms
        if (this.options.reloadPeriod){
            this.options.reloadPeriod = moment.duration(this.options.reloadPeriod);
            this.options.reloadPeriod =
                moment.isDuration(this.options.reloadPeriod) ?
                this.options.reloadPeriod.as('ms') :
                0;
        }
        this.firstLoad = true;

        if (!this.options.dontLoad)
            this.load();
    }

    // expose access to the constructor
    $.BsMessageGroup = BsMessageGroup;

    $.bsMessageGroup = function( options ){
        return new $.BsMessageGroup( options );
    };

	//Extend the prototype
	$.BsMessageGroup.prototype = {
        _add: function( options, url, urlIndex ){
            var _this = this,
                defaultMessageOptions = options.defaults || {},
                urlId = options.id || this.options.id || '';

            $.each( options.messages || [], function( index, messageOptions ){
                _this.list.push(
                    $.bsMessage(
                        $.extend({
                            index     : index,
                            totalIndex: urlIndex*10000 + index,
                            urlIndex  : urlIndex,
                            urlId     : urlId
                        },
                            defaultMessageOptions,
                            messageOptions
                        ),
                   _this )
                );
            });
        },

        _closeCurrentMessageModal: function(){
            //Close and remove modal for current message (if any)
            if (!this.currentMessage) return;

            if (this.currentMessage.bsMarkdown){
                this.currentMessage.bsMarkdown.bsModal = null;
                this.currentMessage.bsMarkdown.$modalContainer = null;
                this.currentMessage.bsMarkdown = null;
            }

            if (this.currentMessage.currentModal){
                this.currentMessage.currentModal.close();
                this.currentMessage.currentModal.remove();
                this.currentMessage.currentModal = null;
            }
            this.currentMessage = this.currentMessage.otherMessage;
            if (this.currentMessage)
                this._closeCurrentMessageModal();
        },

        preLoad: function(){
            this.isLoading = true;

            this._closeCurrentMessageModal();

            if (this.bsModal){
                this.bsModal.close();
                this.bsModal.remove();
            }
            this.bsModal = null;

            this.list = [];
            this.bsTable = null;

            this.options.onStartLoading( this );
        },

        load: function(){
            var _this = this;
            this.preLoad();

            if (this.firstLoad){
                this.firstLoad = false;
                $.each(this.options.url, function(index, singleUrl){
                    _this.options.url[index] = _this.options.convertUrl(singleUrl);
                });
            }
            Promise
                .all( this.options.url.map( function(url){ return Promise.getJSON(url); }) )
                .then   ( $.proxy(this.resolve, this) )
                .catch  ( $.proxy(this.reject,  this) );
        },

        resolve: function( jsonList ){
            var _this = this;
            $.each(jsonList, function(index, json){
                if (json)
                    _this._add( json, _this.options.url[index], index );
            });

            this.isLoading = false;
            this.retryPeriod = 0;
            this.sort();
            this.options.onCreate( this );
            this.options.onFinishLoading( this );
            this._onChange();

            if (this.options.reloadPeriod)
                window.setTimeout( $.proxy(this.load, this), this.options.reloadPeriod );

            //Show all messages marked to be shown on load
            $.each( this.list, function( index, message ){
                if (message.options.showOnLoad)
                    message.asBsModal(true, true);
            });

        },

        reject: function(error){
            Promise.defaultErrorHandler(error);
            this.options.onErrorLoading( this );
            this.retryPeriod = Math.min( this.options.reloadPeriod || 60*60*1000,  this.retryPeriod ? this.retryPeriod*1.5 : 1000 );
            window.setTimeout( $.proxy(this.load, this), this.retryPeriod );
        },

        _onChange: function(){
            this.options.onChange( this );
        },


        _getMessageById: function( id ){
            var result = null;
            $.each( this.list, function( index, message ){
                if (message.options.id == id){
                    result = message;
                    return false;
                }
            });
            return result;
        },

        //_getTypeIcon( type ) return the icon used for type
        _getTypeIcon: function( type, asClassName ){
            var result = {
                icon: $.bsNotyIcon[type]
            };
            return asClassName ? result.icon : result;
        },

        //_getStatusIcon( type ) return the icon used for status
        _getStatusIcon: function( status, asClassName ){
            var result = status ? {icon: this.options.icons.envelopeOpen} : {icon: this.options.icons.envelopeClosed};
            return asClassName ? result.icon : result;
        },


        setStatus: function( message, status ){
            if (message.options.status != status){
                message.options.status = status;
                this.options.saveStatus( message, status );

                //Change the status-icon in the row of this.bsTable (if any) to 'read'
                var statusOnIcon  = this._getStatusIcon(true).icon,
                    statusOffIcon = this._getStatusIcon(false).icon;

                if (this.bsTable)
                    this.bsTable.find('tr#_'+message.options.id+' td i.' + $.FONTAWESOME_PREFIX + '.'+statusOffIcon)
                        .removeClass(statusOffIcon)
                        .addClass(statusOnIcon);


                this._onChange( this );
            }
        },

        setAllStatus: function( status ){
            var _this = this;
            $.each( this.list, function( index, message ){
                _this.setStatus( message, status );
            });
        },

        //getAllStatus( type ) - return status of the group {total, read, unread}
        getAllStatus: function( type ){
            var result = {total: 0, publish: 0, read: 0, unread: 0 };

            $.each( this.list, function( index, message ){
                if (!type || message.options.type == type){
                    result.total++;
                    if (message.options.publish){
                        result.publish++;
                        if (message.options.status)
                            result.read++;
                        else
                            result.unread++;
                    }
                }
            });
            return result;
        },


        setLanguage: function( language ){
            this.options.language = language;
            $.each( this.list, function( index, message ){
                if (message.bsMarkdown)
                    message.bsMarkdown.setLanguage( language );
            });
        },

        /**********************************************
        Sorting
        **********************************************/
        sort: function( sortBy, sortDesc ){
            this.options.sortBy = sortBy || this.options.sortBy;
            if ($.type(sortDesc) == 'boolean')
                this.options.sortDesc = sortDesc;

            var sortByList = $.isArray(this.options.sortBy) ? this.options.sortBy : [this.options.sortBy],
                typeToVal = {
                    info   : 1,
                    help   : 2,
                    warning: 3
                };

            function sortMessage( mess1, mess2, sortByList, desc ){
                var result = 0, val1 = 0, val2 = 0;
                if (desc)
                    return sortMessage( mess2, mess1, sortByList);

                $.each( sortByList, function( index, sortBy ){
                    switch (sortBy){
                        case 'INDEX' : val1 = mess1.options.totalIndex;         val2 = mess2.options.totalIndex;        break;
                        case 'DATE'  : val1 = mess1.options.date.valueOf();     val2 = mess2.options.date.valueOf();    break;
                        case 'STATUS': val1 = mess1.options.status ? 1 : 0;     val2 = mess2.options.status ? 1 : 0;    break;
                        case 'TYPE'  : val1 = typeToVal[mess1.options.type];    val2 = typeToVal[mess2.options.type];   break;
                        default      : val1 = val2 = 0;
                    }
                    result = val1 - val2;
                    if (result != 0)
                        return false;
                });
                return result;
            }

            var _sortDesc = this.options.sortDesc;
            this.list.sort( function( mess1, mess2 ){
                return sortMessage( mess1, mess2, sortByList, _sortDesc );
            });
        },


        /**********************************************
        asBsTable - return all messages in a table
        **********************************************/
        asBsTable: function(){
            var _this = this,
                options = {
                    showHeader    : false,
                    verticalBorder: false,
                    selectable    : true,
                    allowReselect : true,
                    //small         : true,
                    onChange      : function( id ){
                        _this._getMessageById( id.slice(1) ).asBsModal( true );
                    },
                    columns: [],
                    content: []
                };


            if (this.options.showStatus)
                options.columns.push({
                    id: 'status',
                    header: '',
                    align: 'center',
                    verticalAlign: 'top',
                    width: '1.2rem',
                    //noHorizontalPadding: true
                });

            if (this.options.showType)
                options.columns.push({
                    id: 'type',
                    header: '',
                    align: 'center',
                    verticalAlign: 'top',
                    width: '1.2rem',
                    //noHorizontalPadding: true
            });

            if (this.options.vfFormat && this.options.dateInColumn)
                options.columns.push({
                    id: 'date',
                    header: '',
                    align: 'center',
                    noWrap: true,
                    verticalAlign: 'top',
                    vfFormat: this.options.vfFormat,
                    vfOptions: this.options.vfOptions
                });

            options.columns.push({
                id: 'title',
                header: '',
                align: 'left',
                verticalAlign: 'top'
            });

            $.each( this.list, function( index, message ){
                if (message.options.publish)
                    options.content.push( message._asBsTableContent() );
            });

            this.bsTable = this.bsTable || $.bsTable( options );
            return this.bsTable;
        },



        /**********************************************
        asBsModal - return a bsModal with all messages
        **********************************************/
        asBsModal: function( show ){
            var _this = this;
            this.bsModal =
                this.bsModal ||
                this.asBsTable().asModal({
                    header: this.options.header,
                    buttons: this.options.showStatus ?
                                [{
                                    icon   : this._getStatusIcon( true, true ),
                                    text   : {da:'Márker alle som læst', en:'Mark all as read'},
                                    onClick: function(){ _this.setAllStatus( true ); }
                                }]
                             : null,
                    show  : false
                });

            if (show)
                this.bsModal.show();

            return this.bsModal;
        }


	};

}(jQuery, this, document));
