/*
 *  helper.js
 *
 *  Created by Masatoshi Teruya on 13/05/13.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";

//#src
function idx2pos( str, idx )
{
    var line;
    
    line = str.slice( 0, idx ).match( /\n/g );
    line = ( line && line.length || 0 ) + 1;
    
    return {
        line: line,
        colmn: ( line !== 1 ) ? idx - str.lastIndexOf( '\n', idx ) : idx
    };
}

//#end

module.exports = {
    idx2pos: idx2pos
};
