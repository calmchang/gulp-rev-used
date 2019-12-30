
`gulp-rev-used`是基于`gulp-rev`的一款插件，目的用于检查哪些资源文件是没有被使用到的，方便提示开发及时删除不必要的资源




```
function setFileHashVersion(cb){
  return gulp.src([`src/**/*.*`])
    .pipe($.rev())
    .pipe(gulp.dest(`temp/files`))
    .pipe($.rev.manifest())
    .pipe(gulp.dest(`temp`))
}


function checkUsed(cb){
  return gulp.src([
    `temp/rev-manifest.json`,
    `temp/files/**/*.*`,
  ])
  .pipe($.revUsed({
    remove:true,//指定是否需要删除没有被使用到的文件
    root:`${__dirname}/temp/files`,//资源文件的根目录
  }))
}

```