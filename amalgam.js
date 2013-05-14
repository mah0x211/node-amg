/*
    amalgamation settings.
*/
module.exports = {
    build: [
        {
            name: 'amg',
            dir: 'build/bin',
            srcs: [
                './lib/helper.js',
                './lib/print.js',
                './lib/verify.js',
                './lib/parse.js',
                './lib/output.js',
                './lib/compile.js',
                './bin/amg.js'
            ],
            deps: {
                assert: 'assert',
                util: 'util',
                fs: 'fs',
                exec: 'child_process.exec',
                proves: 'proves',
                cc: 'cli-color'
            },
            dels: [
                'HELPER.'
            ],
            compile: {
                deps_externs: true,
                externs: [
                    './build/externs.js'
                ],
                opts: {
                    summary_detail_level: '3',
                    warning_level: 'VERBOSE',
                    language_in: 'ECMASCRIPT5_STRICT',
                    //compilation_level: 'WHITESPACE_ONLY',
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    compilation_level: 'ADVANCED_OPTIMIZATIONS',
                    formatting: 'pretty_print',
                    //debug: 'true',
                    //jscomp_dev_mode: 'START_AND_END',
                    //print_ast: '',
                    //print_pass_graph: '',
                    //print_tree: '',
                }
            }
        }
    ]
};

