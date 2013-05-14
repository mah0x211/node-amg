/*
 *  compile.js
 *
 *  Created by Masatoshi Teruya on 13/04/28.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";
var fs = require('fs'),
    exec = require('child_process').exec,
    print = require('./print'),
    util = require('util');

//#src:compile
function init_compile(){

function dependencyExterns( deps, deps_ext )
{
    var fmtDecl = 'var %s = %s;',
        fmtProp = '%s.%s = %s;',
        fmtPropBrk = '%s[\'%s\'] = %s;',
        DEP_T_BOL = 1 << 0,
        DEP_T_STR = 1 << 1,
        DEP_T_NUM = 1 << 2,
        DEP_T_FNC = 1 << 3,
        DEP_T_OBJ = 1 << 4,
        DEP_T_ARR = 1 << 5,
        DEP_TV_VAL = {
            'boolean': {
                type: DEP_T_BOL,
                val: 'true'
            },
            'string': {
                type: DEP_T_STR,
                val: '\'\''
            },
            'number': {
                type: DEP_T_NUM,
                val: 0
            },
            'function': {
                type: DEP_T_FNC,
                val: 'function(args){}',
                nest: true,
                prefix: '.prototype'
            },
            'object': {
                type: DEP_T_OBJ,
                val: '{}',
                nest: true,
                prefix: ''
            },
            'array': {
                type: DEP_T_ARR,
                val: '[]',
            }
        },
        // ignore
        IGNORE_PROPS = {
            'apply': true,
            'call': true,
            'caller': true,
            'bind': true,
            'prototype': true,
            'constructor': true,
            'super_': true,
            'arguments': true,
            'toString': true
        },
        externs = [],
        refs = [],
        dep_tv = {},
        count = 0,
        getDepTV = function( obj )
        {
            var tv = DEP_TV_VAL[typeof obj];
            
            if( tv && tv.type === DEP_T_OBJ && obj instanceof Array ){
                tv = DEP_TV_VAL['array'];
            }
            
            return tv;
        },
        getNames = function( obj )
        {
            var names = {},
                appendName = function( p )
                {
                    if( !names[p] && !IGNORE_PROPS[p] && !p.match( /^_/ ) ){
                        names[p] = true;
                    }
                };
            
            try
            {
                Object.getOwnPropertyNames( obj )
                .forEach( appendName );
                // non enumerable properties
                Object.getOwnPropertyNames( obj.__proto__ )
                .forEach( appendName );
            }
            catch(e){
                print.warn( 'getNames ' + e.message );
            }
            
            return Object.keys( names );
        },
        addProps = function( prefix, obj )
        {
            if( refs.indexOf( obj ) === -1 )
            {
                var err;
                
                refs.push( obj );
                
                getNames( obj ).forEach(function(p)
                {
                    err = undefined;
                    dep_tv = undefined;
                    
                    try
                    {
                        dep_tv = getDepTV( obj[p] );
                        if( dep_tv )
                        {
                            count++;
                            if( dep_tv.type === DEP_T_FNC ){
                                externs.push( '/** \n * @param {...*} args\n */' );
                            }
                            
                            // use bracket if non-standard property name
                            if( p.match( /(?:^[0-9])|[./-]/ ) ){
                                externs.push( 
                                    print.format( fmtPropBrk, prefix, p, dep_tv.val )
                                );
                            }
                            else {
                                externs.push( 
                                    print.format( fmtProp, prefix, p, dep_tv.val )
                                );
                            }
                        }
                    }
                    catch(e){
                        print.warn( '%s -> %s', p, e.message );
                        err = e;
                    }
                    
                    if( !err && dep_tv && dep_tv.nest &&
                        ( dep_tv.type === DEP_T_OBJ || 
                          ( dep_tv.type === DEP_T_FNC && 
                            obj.hasOwnProperty( p ) === true ) ) ){
                        addProps( prefix + '.' + p + dep_tv.prefix, obj[p] );
                    }
                });
            }
        };
    
    // load dependencies
    Object.keys( deps ).forEach(function(name)
    {
        print.log( print.green( 'dependency externs: ' + name ) );
        var prop = deps[name].split('.'),
            path = prop.shift(),
            mod = require( path );
        
        refs = [];
        count = 0;
        prop.forEach(function(p){
            mod = mod[p];
        });
        
        dep_tv = getDepTV( mod );
        if( dep_tv.val )
        {
            count++;
            externs.push( print.format( fmtDecl, name, dep_tv.val ) );
            if( dep_tv.nest ){
                addProps( name + dep_tv.prefix, mod );
            }
            externs.push('');
            print.log( print.green( 'number of externs: ' + count ) );
        }
    });
    
    // output to file
    print.log( print.green( 'output dependency externs: ' ) + deps_ext );
    fs.writeFileSync( deps_ext, externs.join('\n') );
}

function Compile( cfg, next )
{
    if( cfg.compile )
    {
        var gcc = cfg.compile.path,
            opts = cfg.compile.opts,
            args = [];
        
        if( cfg.compile.deps_externs ){
            var deps_ext = cfg.dir + '/deps_externs.js';
            cfg.compile.externs.push( deps_ext );
            dependencyExterns( cfg.deps, deps_ext );
        }
        
        // set options
        opts.js = cfg.output;
        opts.js_output_file = cfg.dir + '/' + cfg.name + '_gcc.js';
        // add options
        Object.keys( opts ).forEach(function( key )
        {
            if( opts[key] ){
                args.push( ' --' + key + '=' + opts[key] );
            }
            else {
                args.push( ' --' + key );
            }
        });
        // add externs option
        cfg.compile.externs.forEach(function(item){
            args.push( ' --externs=' + item );
        });
        
        print.log( print.magenta('invoke command:\n' ) + gcc + ' \\' );
        print.log( args.join( ' \\\n' ) + '\n' );
        
        exec( gcc + ' ' + args.join(' '), function( e, so, se )
        {
            if( e ){
                throw e;
            }
            else if( se ){
                print.log( se );
            }
            print.log( 
                print.magenta('rename: ') + '%s -> %s',
                opts.js_output_file, 
                opts.js
            );
            fs.renameSync( opts.js_output_file, opts.js );
            next();
        });
    }
    else {
        print.log( 'undefined compile option' );
        next();
    }
}

return Compile;

}

//#end

module.exports = init_compile();

