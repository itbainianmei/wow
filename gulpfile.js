/**
 * Created by ying-xia on 15/8/25.
 */
//载入插件
var gulp = require('gulp');
module.exports = gulp;
var gulpPlugins = require('gulp-load-plugins')({
    rename: {'gulp-usemin-html': 'usemin'}
});
var pngquant = require('imagemin-pngquant');
var Browsersync = require('browser-sync').create();
var argv = require('minimist')(process.argv.slice(2));
var reload = Browsersync.reload;
function timestamp() {//时间戳
    var date = new Date();
    var year = date.getFullYear();
    var month = _completion(date.getMonth() + 1);
    var d = _completion(date.getDate());
    var hours = _completion(date.getHours());
    var minutes = _completion(date.getMinutes());
    return year + "." + month + "." + d + " " + hours + ":" + minutes;
    function _completion(n) {//小于10自动补0
        if (typeof n != "number") {
            return NaN;
        }
        if (n >= 0 && n < 10) {
            return "0" + n
        } else {
            return n;
        }
    }
}
/*====================================================创建任务=========================================================*/
//JS校验
gulp.task('hint', function () {
    return gulp.src('./app/tmp/js/*.js')
        .pipe(gulpPlugins.jshint());
});
//JS合并
gulp.task('scripts', function () {
    return gulp.src(['./app/tmp/js/To.js', './app/tmp/js/*.js', '!./app/tmp/js/mobile-pay*.js'])
        .pipe(gulpPlugins.concat('mobile-pay.js'))
        .pipe(gulp.dest('./app/tmp/js'));
});
//CSS合并
gulp.task('css', function () {
    return gulp.src(['./app/tmp/css/normalize.css', './app/tmp/css/*.css', '!./app/tmp/css/*-theme.css', '!./app/tmp/css/mobile-pay*.css'])
        .pipe(gulpPlugins.concat('mobile-pay.css'))
        .pipe(gulpPlugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./app/tmp/css'));
});
//编译scss
gulp.task('scss', function () {
    gulp.src(['./app/scss/**/*.scss', '!./app/scss/ns.scss', '!./app/scss/variables.scss'])
        .pipe(gulpPlugins.sass({outputStyle: 'expanded'}).on('error', gulpPlugins.sass.logError))
        .pipe(gulp.dest('./app/tmp/css'));
});
//图片版本管理
gulp.task('revImg', function () {
    return gulp.src(['./app/tmp/images/*', '!./app/tmp/images/*.json'])
        .pipe(gulpPlugins.rev())
        .pipe(gulp.dest('./app/tmp/images'))
        .pipe(gulpPlugins.rev.manifest())
        .pipe(gulp.dest('./app/tmp/images'));
});
//CSS版本管理
gulp.task('revCss', ['cssBackup'], function () {
    return gulp.src(['./app/tmp/css/mobile-pay.css'])
        .pipe(gulpPlugins.rev())
        .pipe(gulpPlugins.header('/*最后修改日期 <%= date %>*/\n', {date: timestamp()}))
        .pipe(gulp.dest('./app/tmp/css'))
        .pipe(gulpPlugins.rev.manifest())
        .pipe(gulp.dest('./app/tmp/css'));
});
//JS版本管理
gulp.task('revJs', ['jsBackup'], function () {
    return gulp.src('./app/tmp/js/mobile-pay.js')
        .pipe(gulpPlugins.rev())
        .pipe(gulpPlugins.header('/*最后修改日期 <%= date %>*/\n', {date: timestamp()}))
        .pipe(gulp.dest('./app/tmp/js'))
        .pipe(gulpPlugins.rev.manifest())
        .pipe(gulp.dest('./app/tmp/js'));
});
//CSS压缩
gulp.task('cssmin', function () {
    gulp.src('./app/static/css')
        .pipe(gulpPlugins.clean());
    gulp.src('./app/tmp/css/mobile-pay-*.css')
        .pipe(gulpPlugins.cssmin())
        .pipe(gulpPlugins.rename({suffix: '.min'}))
        .pipe(gulp.dest('./app/static/css'));
});
//JS压缩
gulp.task('jsmin', function () {
    gulp.src('./app/static/js')
        .pipe(gulpPlugins.clean());
    gulp.src('./app/tmp/js/mobile-pay-*.js')
        .pipe(gulpPlugins.uglify())
        .pipe(gulpPlugins.rename({suffix: '.min'}))
        .pipe(gulp.dest('./app/static/js'));
});
//图片压缩
gulp.task('imgmin', function () {
    return gulp.src('./app/tmp/images/*')
        .pipe(gulpPlugins.imagemin({
            progressive: false,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('./app/static/images'));
});
//发布前更新模板图片链接地址
gulp.task('revCollImg', function () {
    return gulp.src(['./app/tmp/images/*.json', './app/tpl/*.vm'])
        .pipe(gulpPlugins.revCollector({
            replaceReved: false,
            dirReplacements: {
                '/tmp/images/': '${ctx.contextPath}/static/images/'
            }
        }))
        .pipe(gulp.dest('./app/tpl'));
});
//发布前更新模板CSS链接地址
gulp.task('revCollCss', function () {
    return gulp.src(['./app/tmp/css/*.json', './app/tpl/*.vm'])
        .pipe(gulpPlugins.revCollector({
            replaceReved: false,
            dirReplacements: {
                '/tmp/css/': '${ctx.contextPath}/static/css/'
            }
        }))
        .pipe(gulp.dest('./app/tpl/'));
});
//发布前更新模板JS链接地址
gulp.task('revCollJs', function () {
    return gulp.src(['./app/tmp/js/*.json', './app/tpl/*.vm'])
        .pipe(gulpPlugins.revCollector({
            replaceReved: false,
            dirReplacements: {
                '/tmp/js/': '${ctx.contextPath}/static/js/'
            }
        }))
        .pipe(gulp.dest('./app/tpl'));
});
//VM模板预览
gulp.task('tpl', function () {
    gulp.src(config.tpl_config.root + argv.env)
        .pipe(gulpPlugins.velocity(config.tpl_config))
        .pipe(gulpPlugins.rename({
            suffix: "-vm",
            extname: ".html"
        }))
        .pipe(gulp.dest(config.tmp_output));

});
//发布前替换为压缩版本
gulp.task('usemin', function () {
    return gulp.src('./app/tpl/*.vm')
        .pipe(gulpPlugins.usemin({
            js: {
                suffix: '.min',
                enable: false
            },
            css: {
                suffix: '.min',
                enable: false
            }
        }))
        .pipe(gulp.dest('./app/tpl/'));
});
//HTML转换VM
gulp.task('copy', function () {
    gulp.src('./app/tmp/*.html')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulpPlugins.rename({
            extname: ".vm"
        }))
        .pipe(gulp.dest('./app/tpl/'))
});
//vm模板上传svn
gulp.task('svnVm', function () {
    gulp.src('./app/tpl/*.vm')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulp.dest('./app/svn/WEB-INF/views'))
});
gulp.task('static', function () {
    gulp.src('./app/static/**/*')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulp.dest('./app/svn/static'))
});
gulp.task('svn', ['svnVm', 'static']);
//iconfont复制到生产目录
gulp.task('iconfont', function () {
    gulp.src('./app/tmp/iconfont/*')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulp.dest('./app/static/iconfont'))
});
//清除文件
gulp.task('clean', function () {
    return gulp.src('./app/tmp/*-tpl.html')
        .pipe(gulpPlugins.clean());
});
//CSS升级版本备份旧版本
gulp.task('cssBackup', function () {
    gulp.src('./app/tmp/css/mobile-pay-*.css')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulp.dest('./app/tmp/css/backup/'));
    gulp.src('./app/tmp/css/mobile-pay-*.css')
        .pipe(gulpPlugins.clean());
});
//JS升级版本备份旧版本
gulp.task('jsBackup', function () {
    gulp.src('./app/tmp/js/mobile-pay-*.js')
        .pipe(gulpPlugins.contribCopy())
        .pipe(gulp.dest('./app/tmp/js/backup/'));
    gulp.src('./app/tmp/js/mobile-pay-*.js')
        .pipe(gulpPlugins.clean());
});

//替换
gulp.task('replace', function () {
    gulp.src('./app/tmp/css/v-2.css')
        .pipe(gulpPlugins.replace('\n', '{}'))
        .pipe(gulp.dest('./app/tmp/css/'));
});
//发布
gulp.task('release', function () {
    gulpPlugins.runSequence('revImg', 'revCss', 'revJs', 'cssmin', 'jsmin', 'imgmin', 'revCollImg', 'revCollCss', 'revCollJs', 'usemin');
});
//重载浏览器
gulp.task('reload', ['css', 'scripts'], function () {
    Browsersync.init({
        proxy: "http://localhost:1337/tmp/"
    });
    gulp.watch(['./app/tmp/css/*.css', './app/tmp/js/*.js', './app/tmp/**/*.html']).on('change', reload);
});
//导入模块
gulp.task('fileinclude', function () {
    gulp.src(['./app/tmp/*.html'])
        .pipe(gulpPlugins.fileInclude({
            prefix: '@'
        }))
        .pipe(gulp.dest('./app/tmp'));
});
//监听文件
gulp.task('watchScss', function () {
    gulp.watch(['./app/scss/**/*.scss'], ['scss']);
});
gulp.task('watchCss', function () {
    gulp.watch(['./app/tmp/css/*.css'], ['css']);
});
gulp.task('watchJs', function () {
    gulp.watch(['./app/tmp/js/*.js'], ['scripts']);
});
gulp.task('watchVm', function () {
    gulp.watch(['./app/tpl/*.vm'], ['tpl']);
});
gulp.task('watch', function () {
    gulpPlugins.runSequence('watchScss', 'watchCss', 'watchJs', 'watchVm', 'reload');
});

