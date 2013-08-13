/*
 *  verify.js
 *
 *  Created by Masatoshi Teruya on 13/05/12.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";
var pkg = {
        path: require('path')
    },
    assert = require('assert'),
    fs = require('fs'),
    exec = require('child_process').exec,
    proves = require('proves'),
    print = require('./print');

//#src:verify
function init_verify(){

function verify_name( cfg, key )
{
    var val = proves.get( cfg, key ),
        label = key.join('.');
    
    assert( proves.is.str( val ) && ( val = val.trim() ).length, 
            label + ' must be string' );
    assert( val.match( '^[a-zA-Z0-9_](?:[a-zA-Z0-9_.])*$' ), 
            label + ' range must be <^[a-zA-Z0-9](?:[a-zA-Z0-9_.])*$>' );
    proves.set( cfg, key, val );
    
    return val;
}

function verify_dir( cfg, key )
{
    var val = proves.get( cfg, key ),
        label = key.join('.'),
        tmp;
    
    assert( proves.is.str( val ) && ( val = val.trim() ).length, 
            label + ' must be string' );
    
    tmp = proves.is.dir( process.cwd() + '/' + val );
    assert( tmp, label + ': ' + val + ' must be directory' );
    proves.set( cfg, key, tmp );
    
    return val;
}

function verify_srcs( cfg, key )
{
    var val = proves.get( cfg, key ),
        label = key.join('.'),
        tmp;

    assert( proves.is.arr( val ), label  + ' must be array' );
    val = val.map(function(path)
    {
        assert( proves.is.str( path ) && ( path = path.trim() ).length, 
                label + ' item must be string' );
        
        tmp = proves.is.file( process.cwd() + '/' + path );
        assert( tmp, path + ' is not file' );
        
        return tmp;
    });
    
    proves.set( cfg, key, val );
    
    return val;
}

function verify_dels( cfg, key )
{
    var val = proves.get( cfg, key );
    
    if( val )
    {
        var label = key.join('.');
        
        assert( proves.is.arr( val ), label + ' must be array' );
        val = val.map(function(str)
        {
            assert( proves.is.str( str ) && ( str = str.trim() ).length, 
                    label + ' item must be string' );
            return str;
        });
    }
    else {
        val = [];
    }
    proves.set( cfg, key, val );
    
    return val;
}

function verify_deps( cfg, key )
{
    var val = proves.get( cfg, key ),
        label = key.join('.'),
        str;

    if( val )
    {
        assert( proves.is.obj( val ), label + ' must be object' );
        for( var name in val )
        {
            str = val[name];
            assert( proves.is.str( str ) && ( str = str.trim() ).length, 
                    label  + '.' + name + ' must be string' );
            
            val[name] = str;
        }
    }
    else {
        val = {};
        proves.set( cfg, key, val );
    }
    
    return val;
}

function verify_target( cfg, key )
{
    var val = proves.get( cfg, key );

    if( val )
    {
        assert( proves.is.str( val ) && ( val = val.trim() ).length, 
                key.join('.') + ' must be string' );
        proves.set( cfg, key, val );
    }
    
    return val;
}

function verify_assign( cfg, key )
{
    var val = proves.get( cfg, key ),
        label = key.join('.');

    if( val )
    {
        assert( proves.is.str( val ) && ( val = val.trim() ).length, 
                label + ' must be string' );
        assert( !!cfg.target, 'target not defined' );
        proves.set( cfg, key, val );
    }
    else if( cfg.target ){
        assert( false, label + ' not defined' );
    }
    
    return val;
}

function verify_compile( cfg, key )
{
    var val = proves.get( cfg, key );
    
    if( val ){
        var label = key.join('.');
        assert( proves.is.obj( val ), label + ' must be object' );
    }
    
    return val;
}

function verify_compile_path( cfg, key )
{
    var val = proves.get( cfg, key );
    
    if( val )
    {
        var label = key.join('.'),
            tmp;
        
        assert( proves.is.str( val ) && ( val = val.trim() ).length, 
                label + ' must be object' );
        
        tmp = proves.is.file( process.cwd() + '/' + val );
        assert( tmp, label + ': ' + val + ' not found' );
        proves.set( cfg, key, tmp );
    }
    else {
        proves.set( cfg, key, '' );
    }

    return val;
}

function verify_compile_opts( cfg, key )
{
    var val = proves.get( cfg, key );
    
    if( val )
    {
        var label = key.join('.'),
            str;

        assert( proves.is.obj( val ), label + ' must be object' );
        for( var name in val )
        {
            str = val[name];
            assert( proves.is.str( str ) && ( str = str.trim() ).length, 
                    label  + '.' + name + ' must be string' );
            val[name] = str;
        }
    }
    else {
        proves.set( cfg, key, {} );
    }
    
    return val;
}

function verify_compile_externs( cfg, key )
{
    var val = proves.get( cfg, key );
    
    if( val )
    {
        var label = key.join('.'),
            tmp;
        
        assert( proves.is.arr( val ), label + ' must be array' );
        val = val.map(function(path)
        {
            assert( proves.is.str( path ) && ( path = path.trim() ).length, 
                    label + ' item must be string' );
            
            tmp = proves.is.file( process.cwd() + '/' + path );
            assert( tmp, path + ' is not file' );
            return tmp;
        });
        
        proves.set( cfg, key, val );
    }
    else {
        proves.set( cfg, key, [] );
    }

    return val;
}

var VERIFIER = {
    'name': verify_name,
    'dir': verify_dir,
    'srcs': verify_srcs,
    'dels': verify_dels,
    'deps': verify_deps,
    'target': verify_target,
    'assign': verify_assign,
    'compile': verify_compile,
    'compile.opts': verify_compile_opts,
    'compile.path': verify_compile_path,
    'compile.externs': verify_compile_externs
};

function Verify( cfg, next )
{
    var fmt = print.green('verify build.%s: ') + '%s --- ' + print.green('OK'),
        fnVerify = function( field )
        {
            field.split(',').forEach(function(name){
                name = name.trim();
                print.log( fmt, name, VERIFIER[name]( cfg, name.split('.') ) );
            });
        };
    
    fnVerify( 'name,dir,srcs,dels,deps,target,assign,compile' );
    
    if( cfg.compile )
    {
        fnVerify( 'compile.opts,compile.path,compile.externs' );
        
        if( !cfg.compile.path )
        {
            print.info( print.magenta( 'exec which closure-compiler' ) );
            exec( 'which closure-compiler', function( err, so, se )
            {
                if( err ){
                    throw err;
                }
                else if( se ){
                    throw new Error( se );
                }
                proves.set( cfg, 'compile.path', so.trim() );
                print.log( 
                    print.green( 'config.compile.path: ' ) + '%s --- ' + 
                    print.green('OK'), so.trim()
                );
                next();
            });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
}

return Verify;

}

//#end

module.exports = init_verify();

