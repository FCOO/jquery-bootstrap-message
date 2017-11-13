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
