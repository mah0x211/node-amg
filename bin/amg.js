#!/usr/bin/env node
/*
 *  amg.js
 *
 *  Created by Masatoshi Teruya on 13/04/28.
 *  Copyright 2013 Masatoshi Teruya. All rights reserved.
 *
 */
"use strict";
// dependencies
var pkg = {
        path: require('path'),
    },
    fs = require('fs'),
    assert = require('assert'),
    util = require('util'),
    exec = require('child_process').exec,
    proves = require('proves');

// shared variables
var print = require('../lib/print'),
    verify = require('../lib/verify'),
    parse = require('../lib/parse'),
    output = require('../lib/output'),
    compile = require('../lib/compile');

//#src
var CFGFILE = 'amalgam.js',
    LINE80 = (new Array(81)).join('-');

/**
 * @param {...*} var_args
 */
function exit( var_args )
{
    print.error.apply( print, Array.prototype.slice.call( arguments ) );
    process.exit(0);
}

function changeDir()
{
    var cwd = process.argv[2];
    
    if( !cwd ){
        exit( 'undefined target dir' );
    }
    // resolve target path
    else if( !( cwd = proves.is.dir( cwd ) ) ){
        exit( 'target dir %s not found', process.argv[2] );
    }
    // change working directory
    else {
        print.info( 'chdir: %s', cwd );
        process.chdir( cwd );
    }
    
    return cwd;
}

function readConfig()
{
    var path = proves.is.file( process.cwd() + '/' + CFGFILE ),
        buildCfg = undefined;
    
    if( !path ){
        exit( 'config file %s not found', CFGFILE );
    }
    else
    {
        try
        {
            print.info( 'read config file: %s', path );
            buildCfg = require( path );
            assert( proves.is.arr( buildCfg.build ), 'build field must be array' );
            // check dels
            if( buildCfg.dels )
            {
                assert( proves.is.arr( buildCfg.dels ), 'dels field must be array' );
                buildCfg.dels = buildCfg.dels.map(function(str){
                    assert( proves.is.str( str ) && ( str = str.trim() ).length, 
                            'dels item must be string' );
                    return str;
                });
            }
            else {
                buildCfg.dels = [];
            }
        }
        catch(e) {
            exit( 'failed to read config file %s --- %s', path, e.message );
        }
    }
    
    return buildCfg;
}

function readfiles( cfg, next )
{
    var path,obj;
    
    cfg.files = [];
    for( var i = 0, len = cfg.srcs.length; i < len; i++ )
    {
        path = cfg.srcs[i];
        print.info( print.green('file: ') + path );
        cfg.files.push({
            path: path,
            // extract filename without extension
            name: path.split('/').pop(),
            // read file
            src: fs.readFileSync( path, 'utf8' )
        });
    }
    next();
}


function main()
{
    var buildCfg = {},
        cfg = {},
        tasks = [
            readfiles,
            parse,
            output,
            compile
        ],
        tid = 0,
        nextTask = function()
        {
            var task = tasks[tid++];
            
            if( task ){
                print.log( LINE80 );
                print.info( task.name );
                task( cfg, nextTask );
            }
            else {
                nextBuild();
            }
        },
        nextBuild = function()
        {
            cfg = buildCfg.build.shift();

            if( cfg )
            {
                verify( cfg, function(){
                    cfg.dels = buildCfg.dels.concat( cfg.dels );
                    tid = 0;
                    print.log( LINE80 );
                    print.log( print.yellow( 'build target: ' + cfg.name  ) );
                    nextTask();
                });
            }
            else {
                print.log( LINE80 );
                print.log( print.green( 'completed.' ) );
                print.log( LINE80 );
            }
        };
    
    print.info( 'start amalgamation...' );
    changeDir();
    buildCfg = readConfig();
    nextBuild();
}

main();

//#end
