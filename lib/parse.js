/*
 *  parser.js
 *
 *  Created by Masatoshi Teruya on 13/05/13.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";
var pkg = {
        path: require('path'),
    },
    print = require('./print');

var HELPER = require('./helper');

//#src:parse
function init_parse(){

var ORDER_INLINE = ['extern'],
    ORDER_BLOCK = ['src','ifdef'];

function parseDirective( list, src )
{
    var pos = 0,
        quot = 0,
        blockIdx = [],
        mlc = false,
        start,end,len,ord,args,tmp;
    
    while( pos !== -1 && ( tmp = src[pos] ) )
    {
        // currently multi-line comment
        if( mlc )
        {
            if( tmp === '*' && src[pos+1] === '/' ){
                mlc = false;
                pos++;
            }
        }
        // not in quot and found
        else if( !quot && tmp === '/' && src[pos-1] !== '\\' )
        {
            // multi-line comment
            if( src[pos+1] === '*' ){
                mlc = true;
                pos++;
            }
            // single-line comment
            else if( src[pos+1] === '/' )
            {
                // directive must be start with pound# sign
                if( src[pos+2] === '#' )
                {
                    start = pos;
                    pos += 3;
                    tmp = pos;
                    // search end-of-line
                    while( ( end = src.indexOf( '\n', tmp ) ) !== -1 )
                    {
                        // found
                        if( src[end-1] !== '\\' ){
                            break;
                        }
                        tmp++;
                    }
                    // not found
                    if( end === -1 ){
                        end = src.length;
                    }
                    len = end - start;
                    ord = src.substring( pos, end );
                    pos = end;
                    // block-end level
                    if( ord.match( '^end\\s*' ) )
                    {
                        if( !blockIdx.length )
                        {
                            pos = HELPER.idx2pos( src, start );
                            throw new Error( 
                                print.format( 
                                    'line:%d:%d: found #end directive but there is not block.',
                                    pos.line, pos.colmn
                                )
                            );
                        }
                        tmp = list[blockIdx.pop()];
                        tmp.block = {
                            start: start - 1,
                            end: end
                        };
                        tmp.next = list.length;
                    }
                    // block level
                    else
                    {
                        ord = ord.replace( /[\s\n\\]*/g, '' ).split(':');
                        if( ORDER_BLOCK.indexOf( ord[0] ) !== -1 ){
                            blockIdx.push( list.length );
                        }
                        else if( ORDER_INLINE.indexOf( ord[0] ) === -1 )
                        {
                            pos = HELPER.idx2pos( src, start );
                            throw new Error( 
                                print.format( 
                                    'line:%d:%d: unknown #%s directive',
                                    pos.line, pos.colmn, ord.join(':')
                                )
                            );
                        }
                        
                        list.push({
                            name: ord.shift(),
                            start: start,
                            end: end,
                            len: len,
                            args: ord,
                            next: list.length+1
                        });
                    }
                }
                else {
                    pos = src.indexOf( '\n', pos );
                }
            }
        }
        // skip escape sequence 0x5c
        else if( tmp === '\\' ){
            pos++;
        }
        // found quot
        else if( tmp === '"' || tmp === '\'' )
        {
            // set current quot if not in quot
            if( !quot ){
                quot = tmp;
            }
            // clear current quot if close quot
            else if( quot === tmp ){
                quot = 0;
            }
        }
        pos++;
    }
    
    // verify
    if( blockIdx.length )
    {
        tmp = list[blockIdx.pop()];
        pos = HELPER.idx2pos( src, tmp.start );
        throw new Error( 
            print.format( 
                'line:%d:%d: #end directive not found ',
                pos.line, pos.colmn
            )
        );
    }
}

function parse_src( cfg, file, ord )
{
    var name = undefined,
        pos,msg;
    
    pos = HELPER.idx2pos( file.src, ord.start );
    msg = print.format(
        print.green( '[line:%d:%d] #src:%s' ),
        pos.line, pos.colmn, ord.args.join(':')
    );
    
    if( ord.args.length )
    {
        if( ord.args.length > 1 || ord.args[0].split(',').length > 1 ){
            throw new Error( 
                print.format( '%s - invalid argument <%s>', msg, ord.args.join(':') )
            );
        }
        name = ord.args[0].trim();
    }
    
    // slice source
    if( name ){
        file.code += print.format( 
                        'var %s = (%s)();',
                        name, file.src.substring( ord.end, ord.block.start )
                     );
    }
    else {
        file.code += file.src.substring( ord.end, ord.block.start );
    }
    
    pos = {
        from: HELPER.idx2pos( file.src, ord.end ),
        to: HELPER.idx2pos( file.src, ord.block.start )
    };
    print.log(
        msg + print.magenta( ' <- range from [%d:%d] to [%d:%d]' ),
        pos.from.line, pos.from.colmn, pos.to.line, pos.to.colmn
    );
    file.range = pos;
    
    return 0;
}


function parse_ifdef( cfg, file, ord )
{
    var toBasename = function( src ){
            return pkg.path.basename(src).replace( '.', '\\.' );
        },
        regex = {
            name: new RegExp( '^(?:' + cfg.name + ')$', 'm' ),
            srcs: new RegExp( '^(?:' + cfg.srcs.map( toBasename ).join('|') + 
                              ')$', 'm' )
        },
        pos,msg,key,val;
    
    pos = HELPER.idx2pos( file.src, ord.start );
    msg = print.format(
        print.green( '[line:%d:%d] #ifdef:%s' ),
        pos.line, pos.colmn, ord.args.join(':')
    );

    key = ord.args.shift();
    val = ord.args.map(function(arg){
        return arg.trim();
    }).join('\n');
    
    if( !regex[key] ){
        throw new Error( print.format( '%s - invalid argument <%s>', msg, key ) );
    }
    
    pos = {
        from: HELPER.idx2pos( file.src, ord.start ),
        to: HELPER.idx2pos( file.src, ord.block.end )
    };
    
    if( !regex[key].test( val ) )
    {
        file.code = file.code.replace( 
                        file.src.substring( ord.start, ord.block.end ), ''
                    );
        
        print.log( 
            msg + print.yellow( ' -> remove from [%d:%d] to [%d:%d]' ),
            pos.from.line, pos.from.colmn, pos.to.line, pos.to.colmn
        );
        return ord.next;
    }
    
    print.log( 
        msg + print.magenta( ' <- retain from [%d:%d] to [%d:%d]' ),
        pos.from.line, pos.from.colmn, pos.to.line, pos.to.colmn
    );
    
    return 0;
}

function parse_ext( cfg, file, ord )
{
    var externs = [],
        ext,pos,msg;
    
    pos = HELPER.idx2pos( file.src, ord.start );
    msg = print.format(
        print.green( '[line:%d:%d] #extern:%s' ),
        pos.line, pos.colmn, ord.args.join(':')
    );

    ext = ord.args.shift().trim();
    if( !ext ){
        throw new Error( msg + ' - target object undefined' );
    }
    
    print.log( msg + print.magenta( ' - %s <- %s' ), ext, ord.args );
    
    ord.args[0].split(',').forEach(function(item)
    {
        item = item.trim();
        externs.push( 
            print.format( 
                '%s[\'%s\'] = %s.%s;', 
                ext, item, ext, item
            )
        );
    });
    
    file.code = file.code.replace( 
                    file.src.substring( ord.start, ord.end ), 
                    externs.join('\n')
                );
}

function preprocess( cfg, file, list )
{
    var orderfn = {
            'extern': parse_ext,
            'src': parse_src,
            'ifdef': parse_ifdef
        },
        idx = 0,ord;
    
    file.code = '';
    while( list[idx] )
    {
        ord = list[idx];
        if( orderfn[ord.name]( cfg, file, ord ) ){
            idx = ord.next;
        }
        else {
            idx++;
        }
    }
}

function Parse( cfg, next )
{
    cfg.files.forEach(function( file )
    {
        var list = [];
    
        print.log( print.green( 'file: ' ) + file.path );
        parseDirective( list, file.src );
        if( list.length ){
            preprocess( cfg, file, list );
        }
    });
    
    next();
}

return Parse;

}

//#end

module.exports = init_parse();
