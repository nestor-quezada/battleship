module.exports = function(grunt) {

  
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wiredep: {
      task: {
        src: ['public/views/index.html']
      }
    },
    
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['public/js/**/*.js'],
        dest: 'public/dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
	
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        
      },
      dist: {
        files: {
          'public/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }
    
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['wiredep', 'concat', 'uglify']);
};
