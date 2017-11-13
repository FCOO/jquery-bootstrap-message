/****************************************************************************
    jquery-bootstrap-message-BsMessage.js

    (c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-message
	https://github.com/FCOO

****************************************************************************/

(function ($ /*, window, document, undefined*/) {
	"use strict";

    function periodOrMomentToBoolean(value, checkForIsAfter, refMoment, invalidReturnValue ){
        //value = moment-string or period-string
        var valueMoment;
        refMoment = refMoment || moment();
        invalidReturnValue = invalidReturnValue || false;

        //First check if value is a moment
        valueMoment = moment.isMoment(value) ? value : moment( value );
        if (!valueMoment.isValid()){
            //Check if value is a period
            var duration = moment.duration(value);

            if (moment.isDuration(duration))
                valueMoment = refMoment.clone().add(duration);
            else
                return invalidReturnValue;
        }

        //valueMoment is now a valid moment => test relative to compareWithMoment
        return checkForIsAfter ? valueMoment.isAfter( moment() ) : valueMoment.isSameOrBefore( moment() );
    }


    function BsMessage( options, parent ) {
		this.options =
            $.extend( {},{
                type      : 'info',
                status    : false,
                publish   : true,   //false/true/moment-string/period-string
                expire    : '',     //moment-string/period-string
                becomeRead: '',     //moment-string/period-string
                url       : '',     //url to markdown-file
                link      : '',     //Url to standalone version of the file
                date      : moment().utc().format()

            }, options || {} );

        this.parent = parent;
        this.options.date = moment( this.options.date );
        this.options.id = this.options.id || 'index_' + this.options.index;
        this.options.status = this.parent.options.loadStatus( this );

        /*
        Find the publishMoment = the moment where the message is published
        Used with options.expire and options.becomeRead to determinate if the messsage is expired or read
        As publishMoment use
            1: options.publish if it is a valid moment
            2: options.date if it is a valid moment
            3: now = moment()
        */
        var publishMoment = null;
        if ( ($.type(this.options.publish) == 'string') && moment(this.options.publish).isValid() )
            publishMoment = moment(this.options.publish);
        else
            if ( this.options.date.isValid() )
                publishMoment = this.options.date;
            else
                publishMoment = moment();

        //If publish = moment-string or duration-stirng => convert and check against publishMoment
        if ($.type(this.options.publish) == 'string')
            this.options.publish = periodOrMomentToBoolean(this.options.publish, false, publishMoment);

        //Check for valid expire-string
        if (this.options.expire && this.options.publish)
            this.options.publish = periodOrMomentToBoolean(this.options.expire, true, publishMoment, this.options.publish );

        //Check for valid becomeRead-string
        if (this.options.becomeRead && !this.options.status){
            this.options.status = periodOrMomentToBoolean(this.options.becomeRead, false, publishMoment);

            if (this.options.status)
                this.setStatus( true );
        }

    } //End of constructor

    // expose access to the constructor
    $.BsMessage = BsMessage;

    $.bsMessage = function( options, parent ){
        return new $.BsMessage( options, parent );
    };

	//Extend the prototype
	$.BsMessage.prototype = {
        //getStatus() - return true if the message is read
        getStatus: function(){
            return this.options.status;
        },

        setStatus: function( status ){
            this.parent.setStatus( this, status );
        },


        //_asBsTableContent - return the options adjusted to be shown in a table
        _asBsTableContent: function(){
            var title = [{text: this.options.title}];
            if (this.options.url)
                title.push(
                    {text:'...'},
                    {icon:'fa-angle-right fa-pull-right fa-border'}
                );


            return {
                id    : '_' + this.options.id,
                type  : { icon: $.bsNotyIcon[this.options.type] },
                status: this.parent._getStatusIcon(this.options.status),
                date  : this.options.date,
                title : title
            };

        },

        /**********************************************
        asBsModal - return a bsModal with all messages
        **********************************************/
        asBsModal: function( show ){
            this.setStatus( true );
            var footer = this.parent.options.vfFormat ? {
                            vfValue  : this.options.date,
                            vfFormat : this.parent.options.vfFormat,
                            vfOptions: this.parent.options.vfOptions,
                            textClass: 'ml-auto'
                         }
                         : null;

            if (this.options.url){
                //Show the message in a BsMarkdown
                this.bsMarkdown =
                    this.bsMarkdown || $.bsMarkdown({
                        url : this.options.url,
                        link: this.options.link,

                        languages: this.parent.options.languages,
                        language : this.parent.options.language,

                        header : {
                            icon : this.parent.options.showType ? $.bsNotyIcon[this.options.type] : '',
                            text : this.options.title
                        },
                        footer : footer,
                        loading: this.parent.options.loading
                    });

                this.bsModal = this.bsMarkdown.asBsModal( false );
            }

            else {

                //No file => just display the title in a BsModal
                this.bsModal = this.bsModal || $.bsModal({
                    scroll : false,
                    header : this.parent.options.showTypeHeader ? {
                                icon: $.bsNotyIcon[this.options.type],
                                text: $.bsNotyName[this.options.type]
                             } : null,
                    type   : this.parent.options.showTypeColor ? this.options.type : null,

                    //Create options.title as centered div
                    content: $('<div/>')
                                .addClass('text-center')
                                ._bsAddHtml( {text: this.options.title }),
                    footer : footer,
                    show   : false
                });

            }

            if (show)
                this.bsModal.show();
        }
	};



}(jQuery, this, document));

;
/****************************************************************************
	jquery-bootstrap-message.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-message
	https://github.com/FCOO

****************************************************************************/

(function ($ /*, window, document, undefined*/) {
	"use strict";

    function BsMessageGroup( options ) {
		this.options = $.extend({}, {
            id            : '',
            url           : '',
            header        : '',
            reloadPeriod  : '', //period-string with interval for reloading

            onStartLoading : function( /*messageGroup*/){ },          //Called when loading of messages starts
            onFinishLoading: function( /*messageGroup*/){ },          //Called when loading of messages finish

            onCreate  : function( /*messageGroup*/){ },          //Called when group is created
            onChange  : function( /*messageGroup*/){ },          //Called when the status of the group is changed. (Status=nr of messages, no of (un)read merssages)

            loadStatus: function( /*message*/ ){ return true; }, //Return true if the message is read
            saveStatus: function( /*message [,status]*/ ){},     //Save the status for message


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

            loading   : { icon:' fa-circle-o-notch fa-spin _fa-fw', text: {da:'Indlæser...', en:'Loading...'}}        //Default icon and text displayed in the modal-window during loading
		}, options || {} );

        //Convert url to array of string
        if (!$.isArray(this.options.url))
            this.options.url = this.options.url.split(' ');


        //convert reloadPeriod to ms
        if (this.options.reloadPeriod){
            this.options.reloadPeriod = moment.duration(this.options.reloadPeriod);
            this.options.reloadPeriod =
                moment.isDuration(this.options.reloadPeriod) ?
                this.options.reloadPeriod.as('ms') :
                0;
        }

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
                        $.extend(
                            {
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

        load: function(){
            var _this = this;
            this.isLoading = true;

            $.each( this.list, function( index, message ){
                if (message.bsModal){
                    message.bsModal.modal('hide');
                    message.bsModal.remove();
                }
            });
            if (this.bsModal){
                this.bsModal.modal('hide');
                this.bsModal.remove();
            }
            this.bsModal = null;

            this.list = [];
            this.bsTable = null;
            this.options.onStartLoading( this );
            Promise
                .all(
                    this.options.url.map( function( url, index ){
                        return Promise.getJSON( url )
                                .then ( function( json ){
                                    _this._add( json, url, index );
                                });
                    })
                )
                .finally( this._onLoad.bind(this) );
        },

        _onLoad: function(){
            var _this = this;
            this.isLoading = false;
            this.sort();
            this.options.onCreate( this );
            this.options.onFinishLoading( this );
            this._onChange();

            if (this.options.reloadPeriod)
                window.setTimeout( function(){ _this.load(); }, this.options.reloadPeriod );
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
            var result = status ? {icon:'fa-envelope-open-o'} : {icon: 'fa-envelope'};
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
                    this.bsTable.find('tr#_'+message.options.id+' td i.fa.'+statusOffIcon)
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
        sort( sortBy, sortDesc ){
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
                        case 'DATE'  : val1 = mess1.options.date.second();      val2 = mess2.options.date.second();     break;
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
                    small         : true,
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
                    noHorizontalPadding: true
                });

            if (this.options.showType)
                options.columns.push({
                    id: 'type',
                    header: '',
                    align: 'center',
                    verticalAlign: 'top',
                    width: '1.2rem',
                    noHorizontalPadding: true
            });

            if (this.options.vfFormat)
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
