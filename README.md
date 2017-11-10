# jquery-bootstrap-message
>


## Description
Read, list, display, and marks message read from json meta-data file and markdown source-files
Using [jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap) to create interface and [jquery-bootstrap-markdown](https://github.com/FCOO/jquery-bootstrap-markdown) to convert and display markdown-files


## Installation
### bower
`bower install https://github.com/FCOO/jquery-bootstrap-message.git --save`

## Demo
http://FCOO.github.io/jquery-bootstrap-message/demo/ 

## Usage

    var myMessageGroup = $.bsMessageGroup( options );
    myMessageGroup.asBsModal( true );


### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `id` | `string` | `""` | id for the message-group |
| `url` | `string` | `null` | url to the metadata-file (json) |
| `header` | `content` | `null` | The header for the list modal-window |
| `reloadPeriod` | `number` or `string` | `null` | millisecond or [ISO 8601 Duration-string](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) with interval for reloading |
| `onStartLoading` | `function(messageGroup)` | `null` | Called when loading of messages starts |
| `onFinishLoading` | `function(messageGroup)` | `null` | Called when loading of messages finish |
| `onCreate`  | `function(messageGroup)` | `null` | Called when group is created |
| `onChange`  | `function(messageGroup)` | `null` | Called when the status of the group is changed |
| `loadStatus` | `function(message)` | `return true;` | Return true if the message is read |
| `saveStatus` | `function(message [,status])` | `null` | Save the status for message |
| `sortBy`    | `string or []string` | `"INDEX"` | String or array of string: 'INDEX', 'DATE', STATUS', 'TYPE' |
| `sortDesc`  | `boolean` | `false` |  |
| `languages` | `[]string` | `["en", "da"]` | List of possible language-codes in the md-file. E.q. `<da>Dette er på dansk</de><en>This is in English</en>` |
| `language`  | `string` | `"en"` | Current language-code |
| `showType`     | `boolean` | `false` | If true the type of the messages are shown in the lists |
| `showStatus`   | `boolean` | `false` | If true the status of the messages are shown |
| `showTypeHeader` | `boolean` | `false` | If true the modal-header of no-file messages are set to type-icon + type-name |
| `showTypeColor` | `boolean` | `false` | If true the modal background-color and color of no-file messages get set by the type |
| `vfFormat` | `string` | `""` | Format-id for the date using [jquery-value-format](https://github.com/FCOO/jquery-value-format). The format must be defined in the application. If `vfFormat == ""` the date-column isn't shown |
| `vfOptions` | `object` | `null` | Optional options for the format vfFormat when displaying the date using [jquery-value-format](https://github.com/FCOO/jquery-value-format) |
| `loading` | `content` | See source | Default icon and text displayed in the modal-window during loading |

### Methods

    .load()                         //(re)load the lust of messages
    .setStatus( message, status )   //Sets the status of a message
    .setAllStatus( status )         //Sets status for all messages
    .getAllStatus( type )           //return status of the group : {total: 0, publish: 0, read: 0, unread: 0 }
    .setLanguage( language )        //Change the language
    .sort( sortBy, sortDesc )       //Sort the list
    .asBsTable()                    //return all messages in a bsTable

## File format

The meta-data must be in a JSON-file with the following format

    {
        ""id"     : STRING,
        "defaults": {MESSAGEOPTIONS},
        "messages": [
            {MESSAGEOPTIONS},
            {MESSAGEOPTIONS},
            ...
        ]
    }

- `id` (optional) should be a unique id for any JSON-file. Are passed to each message as `urlId`. <br>If no `id` is given in the file the id for the message-group is used instead
- `defaults` (optional) are the values used as default and `{MESSAGEOPTIONS}` has the following format

| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `id` | `string` | `""` |  |
| `type` | `string` | `"info"` | `"info", "help", "warning", "alert", "error"` |
| `date` | `moment-string` | `now` | The date of the message (UTC) |
| `publish` | `boolean` or `moment-string` or<br>[duration-string](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) relative to `date` | `true` | If or when the message is/can be publish |
| `expire` |`boolean` or `moment-string` or<br> [duration-string](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) relative to `publish` | `false` | If or when the message expire |
| `becomeRead` |`boolean` or `moment-string` or<br>[duration-string](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) relative to `publish` | `""` | If or when a unread message is set to read-status |
| `url` | `string` | `""` | Url to markdown-file |
| `link` | `string` | `""` | Url to standalone version of the markdown-file |



## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-bootstrap-message/LICENSE).

Copyright (c) 2017 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk

