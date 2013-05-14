var module = {
    exports: ''
};

var require = {
  resolve: function(){},
  main: {},
  extensions: {},
  registerExtension: function(){},
  cache: {}
};

var Buffer = {
  isEncoding: function(){},
  poolSize: 0,
  isBuffer: function(){},
  byteLength: function(){},
  concat: function(){}
};

var process = { 
  versions: {},
  argv: [],
  env: {},
  abort: function(){},
  chdir: function(){},
  cwd: function(){},
  umask: function(){},
  getuid: function(){},
  setuid: function(){},
  setgid: function(){},
  getgid: function(){},
  getgroups: function(){},
  setgroups: function(){},
  initgroups: function(){},
  hrtime: function(){},
  memoryUsage: function(){},
  binding: function(){},
  EventEmitter: function(){},
  nextTick: function(){},
  maxTickDepth: 1000,
  stdout: function(){},
  stderr: function(){},
  stdin: function(){},
  openStdin: function(){},
  exit: function(){},
  kill: function(){},
  addListener: function(){},
  on: function(){},
  removeListener: function(){}
};

var pkg = {}
pkg.path = {
  resolve: function(){},
  normalize: function(){},
  join: function(){},
  relative: function(){},
  dirname: function(){},
  basename: function(){},
  extname: function(){},
  _makeLong: function(){},
};

var buildCfg = {
    dels: [],
    build: []
};

var cfg = {
    name: '',
    dir: '',
    srcs: [],
    deps: {},
    dels: [],
    compile: {
        deps_externs: true,
        externs: [],
        opts: {
            accept_const_keyword: '',
            angular_pass: '',
            charset: '',
            closure_entry_point: '',
            common_js_entry_module: '',
            common_js_module_path_prefix: '',
            compilation_level: '',
            create_name_map_files: '',
            create_source_map: '',
            debug: '',
            define: '',
            externs: '',
            extra_annotation_name: '',
            flagfile: '',
            formatting: '',
            generate_exports: '',
            js: '',
            js_output_file: '',
            jscomp_error: '',
            jscomp_off: '',
            jscomp_warning: '',
            language_in: '',
            logging_level: '',
            manage_closure_dependencies: '',
            module: '',
            module_output_path_prefix: '',
            module_wrapper: '',
            only_closure_dependencies: '',
            output_manifest: '',
            output_module_dependencies: '',
            output_wrapper: '',
            print_ast: '',
            print_pass_graph: '',
            print_tree: '',
            process_closure_primitives: '',
            process_common_js_modules: '',
            process_jquery_primitives: '',
            property_map_input_file: '',
            property_map_output_file: '',
            source_map_format: '',
            summary_detail_level: '',
            third_party: '',
            transform_amd_modules: '',
            translations_file: '',
            translations_project: '',
            use_only_custom_externs: '',
            use_types_for_optimization: '',
            variable_map_input_file: '',
            variable_map_output_file: '',
            version: '',
            warning_level: '',
            warnings_whitelist_file: '',
            
        }
    }
};

          
                                        
