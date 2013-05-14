/*
 *  output.js
 *
 *  Created by Masatoshi Teruya on 13/05/11.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";
var fs = require('fs'),
    print = require('./print');

//#src:output
function init_output(){

function addDependency( code, deps )
{
    var fmt = '%s = require(\'%s\')%s',
        line,val;
    
    // add dependencies
    Object.keys( deps ).forEach(function(name)
    {
        val = deps[name].split('.');
        line = print.format( fmt, name, val.shift(), val.length && 
                             '.' + val.join('.') || '' );
        
        print.log( print.green( 'dependency: ') + '%s', line );
        code.push( 'var ' + line + ';' );
    });
}

function mergeSources( code, files )
{
    var fmtComment = '// %s#src range from [%d:%d] to [%d:%d]';
   
    // merge sources
    files.forEach(function(obj)
    {
        print.log( print.green( 'merge file: ' ) + obj.path );
        // append output
        code.push( 
            print.format( 
                fmtComment, obj.name, obj.range.from.line, obj.range.from.colmn, 
                obj.range.to.line, obj.range.to.colmn
            )
        );
        code.push( obj.code );
    });
}

function delStrings( code, dels )
{
    code = code.join('\n');
    // delete strings
    dels.forEach(function(str){
        var re = new RegExp( str.replace( /[.]/g, '\\.' ), 'g' );
        print.log( print.green( 'delete string: ' ) + str );
        code = code.replace( re, '' );
    });
    
    return code;
}

function Output( cfg, next )
{
    var head = '(function(){\n',
        tail = '})();\n',
        code = [];
    
    // set output path
    cfg.output = cfg.dir + '/' + cfg.name + '.js',
    
    addDependency( code, cfg.deps );
    mergeSources( code, cfg.files );
    code = delStrings( code, cfg.dels );
    
    // set target variable
    if( cfg.target )
    {
        print.log( 
            print.magenta( 'target variable: %s = %s' ), 
            cfg.target, cfg.assign
        );
        code = cfg.target + ' = ' + head + 
               code + '\nreturn ' + cfg.assign + ';\n' +
               tail;
    }
    else {
        code = head + code + tail;
    }
    
    // output to file
    print.log( print.green( 'write out: ' ) + cfg.output );
    fs.writeFileSync( cfg.output, code );
    next();
}

return Output;
}

//#end

module.exports = init_output();

